import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  orderCancelledTemplate,
  orderDeliveredTemplate,
  orderShippedTemplate,
  sendEmail,
  type OrderEmailData,
  type OrderItem,
} from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

type UpdateOrderStatusPayload = {
  orderId: string;
  newStatus: OrderStatus;
};

class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchOrderEmailData(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
): Promise<OrderEmailData | null> {
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, customer_email, shipping_address, total_amount, discount_amount, discount_code, delivery_method",
    )
    .eq("id", orderId)
    .single<{
      order_number: string;
      customer_email: string | null;
      shipping_address: { name: string; address: string; city: string; state: string; country: string };
      total_amount: number;
      discount_amount: number | null;
      discount_code: string | null;
      delivery_method: string | null;
    }>();

  if (!order?.customer_email) return null;

  const { data: rawItems } = await supabase
    .from("order_items")
    .select("product_id, quantity, price, selected_color, selected_size")
    .eq("order_id", orderId);

  const productIds = (rawItems ?? []).map((i) => i.product_id);
  const { data: products } = productIds.length > 0
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] };

  const nameMap: Record<string, string> = {};
  for (const p of products ?? []) nameMap[p.id] = p.name;

  const items: OrderItem[] = (rawItems ?? []).map((i) => ({
    name: nameMap[i.product_id] ?? "Product",
    quantity: i.quantity,
    price: i.price,
    color: i.selected_color,
    size: i.selected_size,
  }));

  return {
    orderNumber: order.order_number,
    customerName: order.shipping_address?.name ?? "Customer",
    customerEmail: order.customer_email,
    items,
    discountCode: order.discount_code,
    discountAmount: order.discount_amount ?? 0,
    deliveryMethod: order.delivery_method,
    total: order.total_amount,
    shippingAddress: order.shipping_address,
  };
}

async function maybeSendStatusEmail(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  newStatus: OrderStatus,
): Promise<void> {
  if (!["shipped", "delivered", "cancelled"].includes(newStatus)) return;

  const data = await fetchOrderEmailData(supabase, orderId);
  if (!data) return;

  let subject: string;
  let html: string;

  if (newStatus === "shipped") {
    subject = `Your Order is On Its Way — ${data.orderNumber}`;
    html = orderShippedTemplate(data);
  } else if (newStatus === "delivered") {
    subject = `Your Order Has Been Delivered — ${data.orderNumber}`;
    html = orderDeliveredTemplate(data);
  } else {
    subject = `Order Cancelled — ${data.orderNumber}`;
    html = orderCancelledTemplate(data);
  }

  await sendEmail(data.customerEmail, subject, html);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new HttpError("Server configuration error", 500);
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) throw new HttpError("Unauthorized", 401);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an authenticated admin
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) throw new HttpError("Unauthorized", 401);

    const { data: adminRole } = await supabase
      .from("admin_roles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (!adminRole) throw new HttpError("Forbidden", 403);

    const payload = (await req.json()) as UpdateOrderStatusPayload;
    if (!payload?.orderId || !payload?.newStatus) {
      throw new HttpError("Missing orderId or newStatus", 400);
    }

    const validStatuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(payload.newStatus)) {
      throw new HttpError("Invalid status value", 400);
    }

    // Fetch current order to decide if stock restoration is needed
    const { data: currentOrder, error: orderFetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", payload.orderId)
      .single<{ id: string; status: OrderStatus }>();

    if (orderFetchError || !currentOrder) {
      throw new HttpError("Order not found", 404);
    }

    // Restore stock when cancelling a paid order
    const paidStatuses: OrderStatus[] = ["processing", "shipped", "delivered"];
    if (payload.newStatus === "cancelled" && paidStatuses.includes(currentOrder.status)) {
      const { error: stockError } = await supabase.rpc("restore_order_stock", {
        p_order_id: payload.orderId,
      });
      if (stockError) throw stockError;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: payload.newStatus, updated_at: new Date().toISOString() })
      .eq("id", payload.orderId);

    if (updateError) throw updateError;

    // Fire-and-forget: email failure must not break the status update response
    maybeSendStatusEmail(supabase, payload.orderId, payload.newStatus).catch((err) =>
      console.error(`Status email (${payload.newStatus}) failed:`, err)
    );

    return new Response(
      JSON.stringify({ success: true, status: payload.newStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
