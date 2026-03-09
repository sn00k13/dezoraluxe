import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderPayload {
  idempotencyKey: string;
  orderTotal: number;
  originalTotal: number;
  selectedDeliveryMethodName: string;
  shippingInfo: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product_id: string;
    variant_id?: string | null;
    selected_color?: string | null;
    selected_size?: string | null;
    quantity: number;
    price: number;
  }>;
  discount: {
    codeId: string | null;
    code: string | null;
    type: "percentage" | "fixed" | null;
    value: number | null;
    amount: number;
    customerEmail: string | null;
    customerPhone: string | null;
  };
}

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
};

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const BOT_USER_AGENT_PATTERN =
  /(bot|crawler|spider|headless|curl|wget|postman|insomnia|python-requests|scrapy|httpclient)/i;
const ORDER_ROUTE = "create-order";
const RATE_LIMIT_WINDOW_SECONDS = 60;
const GUEST_RATE_LIMIT_MAX_REQUESTS = 6;
const AUTH_RATE_LIMIT_MAX_REQUESTS = 12;
const STOCK_RESERVATION_MINUTES = 10;

const getClientIp = (req: Request) => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  return "unknown";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = (await req.json()) as CreateOrderPayload;
    const userAgent = req.headers.get("user-agent") ?? "";
    const origin = req.headers.get("origin") ?? "";
    const clientIp = getClientIp(req);
    const allowedOriginsRaw = Deno.env.get("ALLOWED_ORIGINS") ?? "";

    const idempotencyKey = payload?.idempotencyKey?.trim();
    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return new Response(
        JSON.stringify({ error: "Invalid idempotency key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!payload.items || payload.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid items to create order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!userAgent || BOT_USER_AGENT_PATTERN.test(userAgent)) {
      return new Response(
        JSON.stringify({ error: "Request blocked" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Optional domain allow-list for public function endpoints.
    if (allowedOriginsRaw.trim().length > 0) {
      const allowedOrigins = allowedOriginsRaw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (!origin || !allowedOrigins.includes(origin)) {
        return new Response(
          JSON.stringify({ error: "Origin not allowed" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (!Number.isFinite(payload.orderTotal) || payload.orderTotal <= 0 || payload.orderTotal > 50000000) {
      return new Response(
        JSON.stringify({ error: "Invalid order total" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!Number.isFinite(payload.originalTotal) || payload.originalTotal <= 0 || payload.originalTotal > 50000000) {
      return new Response(
        JSON.stringify({ error: "Invalid original total" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (payload.items.length > 25) {
      return new Response(
        JSON.stringify({ error: "Too many items in one order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const hasInvalidItems = payload.items.some(
      (item) =>
        !item.product_id ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20 ||
        !Number.isFinite(item.price) ||
        item.price <= 0 ||
        item.price > 5000000,
    );

    if (hasInvalidItems) {
      return new Response(
        JSON.stringify({ error: "Invalid order items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve authenticated user when present; guests remain null.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (!authError) {
        userId = authData.user?.id ?? null;
      }
    }

    const rateLimitIdentifier = userId ? `user:${userId}` : `ip:${clientIp}`;
    const maxAllowedRequests = userId
      ? AUTH_RATE_LIMIT_MAX_REQUESTS
      : GUEST_RATE_LIMIT_MAX_REQUESTS;
    const { data: isRateLimitOk, error: rateLimitError } = await supabase.rpc(
      "check_function_rate_limit",
      {
        p_identifier: rateLimitIdentifier,
        p_route: ORDER_ROUTE,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        p_max_requests: maxAllowedRequests,
      },
    );

    if (rateLimitError) {
      throw rateLimitError;
    }

    if (!isRateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Idempotency fast-path: return existing order for this key.
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from("orders")
      .select("id, order_number, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle<OrderRow>();

    if (existingOrderError) {
      throw existingOrderError;
    }

    if (existingOrder) {
      return new Response(
        JSON.stringify({ order: existingOrder, reused: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let orderNumber: string;
    try {
      const { data: orderNumberData, error: orderNumberError } = await supabase.rpc("generate_order_number");
      if (orderNumberError || !orderNumberData) {
        throw new Error("RPC generate_order_number failed");
      }
      orderNumber = orderNumberData;
    } catch {
      const year = new Date().getFullYear();
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      orderNumber = `ORD-${year}-${timestamp.toString().slice(-9)}-${random}`;
    }

    const shippingAddressJson = {
      name: `${payload.shippingInfo.firstName} ${payload.shippingInfo.lastName}`,
      address: payload.shippingInfo.address,
      city: payload.shippingInfo.city,
      state: payload.shippingInfo.state,
      zip_code: payload.shippingInfo.zipCode,
      country: payload.shippingInfo.country,
    };

    const { data: createdOrder, error: createOrderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        total_amount: payload.orderTotal,
        status: "pending",
        shipping_address: shippingAddressJson,
        payment_reference: null,
        delivery_method: payload.selectedDeliveryMethodName,
        idempotency_key: idempotencyKey,
        discount_code_id: payload.discount.codeId,
        discount_code: payload.discount.code,
        discount_type: payload.discount.type,
        discount_value: payload.discount.value,
        discount_amount: payload.discount.amount,
        pre_discount_total: payload.originalTotal,
        customer_phone: payload.shippingInfo.phone || null,
        discount_customer_email: payload.discount.customerEmail,
        discount_customer_phone: payload.discount.customerPhone,
      })
      .select("id, order_number, status")
      .single<OrderRow>();

    if (createOrderError) {
      // Handle race on unique idempotency key by returning the already-created row.
      if (createOrderError.code === "23505") {
        const { data: racedOrder } = await supabase
          .from("orders")
          .select("id, order_number, status")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle<OrderRow>();

        if (racedOrder) {
          return new Response(
            JSON.stringify({ order: racedOrder, reused: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      throw createOrderError;
    }

    const orderItems = payload.items.map((item) => ({
      order_id: createdOrder.id,
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      selected_color: item.selected_color ?? null,
      selected_size: item.selected_size ?? null,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      // Best-effort cleanup to avoid orphan pending rows when item insert fails.
      await supabase.from("orders").delete().eq("id", createdOrder.id);
      throw orderItemsError;
    }

    try {
      const { data: reservationResult, error: reservationError } = await supabase.rpc(
        "reserve_order_stock",
        {
          p_order_id: createdOrder.id,
          p_reservation_minutes: STOCK_RESERVATION_MINUTES,
        },
      );

      if (reservationError) {
        throw reservationError;
      }

      return new Response(
        JSON.stringify({
          order: createdOrder,
          reused: false,
          reservationExpiresAt:
            reservationResult && typeof reservationResult === "object"
              ? reservationResult.expires_at ?? null
              : null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (stockError) {
      await supabase.from("orders").delete().eq("id", createdOrder.id);
      if (stockError instanceof Error && /stock|reservation|reservable/i.test(stockError.message)) {
        throw new HttpError(stockError.message, 409);
      }
      throw stockError;
    }
  } catch (error) {
    const errorStatus = error instanceof HttpError ? error.status : 500;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: errorStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
