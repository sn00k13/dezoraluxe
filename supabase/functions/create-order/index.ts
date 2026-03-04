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

type StockRow = {
  id: string;
  stock: number;
};

type StockSource = "products" | "product_variants";

type MergedStockRequest = {
  source: StockSource;
  id: string;
  quantity: number;
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
const STOCK_UPDATE_RETRY_ATTEMPTS = 3;

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

const mergeRequestedQuantities = (items: CreateOrderPayload["items"]) => {
  const mergedRequests = new Map<string, MergedStockRequest>();
  for (const item of items) {
    const source: StockSource = item.variant_id ? "product_variants" : "products";
    const targetId = item.variant_id ?? item.product_id;
    const key = `${source}:${targetId}`;
    const existing = mergedRequests.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }

    mergedRequests.set(key, {
      source,
      id: targetId,
      quantity: item.quantity,
    });
  }
  return mergedRequests;
};

const updateStockWithRetry = async (
  supabase: ReturnType<typeof createClient>,
  source: StockSource,
  stockTargetId: string,
  quantityDelta: number,
) => {
  const updateToApply = quantityDelta === 0 ? 0 : -quantityDelta;
  const shouldCheckAvailableStock = updateToApply < 0;

  for (let attempt = 1; attempt <= STOCK_UPDATE_RETRY_ATTEMPTS; attempt++) {
    const { data: currentStockTarget, error: currentStockTargetError } = await supabase
      .from(source)
      .select("id, stock")
      .eq("id", stockTargetId)
      .maybeSingle<StockRow>();

    if (currentStockTargetError) {
      throw currentStockTargetError;
    }

    if (!currentStockTarget) {
      throw new HttpError("One or more products or variants in the order no longer exist", 400);
    }

    if (
      shouldCheckAvailableStock &&
      (!Number.isFinite(currentStockTarget.stock) || currentStockTarget.stock < Math.abs(updateToApply))
    ) {
      throw new HttpError(`Insufficient stock for ${source} ${stockTargetId}`, 409);
    }

    const newStockValue = currentStockTarget.stock + updateToApply;
    const { data: updatedTarget, error: updateError } = await supabase
      .from(source)
      .update({ stock: newStockValue })
      .eq("id", stockTargetId)
      .eq("stock", currentStockTarget.stock)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (updateError) {
      throw updateError;
    }

    if (updatedTarget) {
      return;
    }
  }

  throw new HttpError(
    "Stock changed while creating your order. Please review your cart and try again.",
    409,
  );
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

    const requestedQuantities = mergeRequestedQuantities(payload.items);
    const requests = Array.from(requestedQuantities.values());
    const productIds = requests
      .filter((request) => request.source === "products")
      .map((request) => request.id);
    const variantIds = requests
      .filter((request) => request.source === "product_variants")
      .map((request) => request.id);

    const [{ data: productStockRows, error: productStockRowsError }, { data: variantStockRows, error: variantStockRowsError }] =
      await Promise.all([
        productIds.length > 0
          ? supabase.from("products").select("id, stock").in("id", productIds)
          : Promise.resolve({ data: [] as StockRow[], error: null }),
        variantIds.length > 0
          ? supabase.from("product_variants").select("id, stock").in("id", variantIds)
          : Promise.resolve({ data: [] as StockRow[], error: null }),
      ]);

    if (productStockRowsError) {
      throw productStockRowsError;
    }

    if (variantStockRowsError) {
      throw variantStockRowsError;
    }

    const productStocksById = new Map<string, number>(
      (productStockRows ?? []).map((row) => [row.id, row.stock]),
    );
    const variantStocksById = new Map<string, number>(
      (variantStockRows ?? []).map((row) => [row.id, row.stock]),
    );

    for (const request of requests) {
      const availableStock =
        request.source === "product_variants"
          ? variantStocksById.get(request.id)
          : productStocksById.get(request.id);

      if (!Number.isFinite(availableStock)) {
        return new Response(
          JSON.stringify({ error: "One or more products or variants no longer exist" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if ((availableStock ?? 0) < request.quantity) {
        return new Response(
          JSON.stringify({
            error: "Insufficient stock for one or more items",
            source: request.source,
            stockTargetId: request.id,
            availableStock,
            requestedQuantity: request.quantity,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
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

    const decrementedTargets: Array<{ source: StockSource; id: string; quantity: number }> = [];
    try {
      for (const request of requestedQuantities.values()) {
        await updateStockWithRetry(supabase, request.source, request.id, request.quantity);
        decrementedTargets.push({
          source: request.source,
          id: request.id,
          quantity: request.quantity,
        });
      }
    } catch (stockError) {
      // Best-effort stock rollback for products already decremented in this request.
      for (const decrementedTarget of decrementedTargets) {
        try {
          await updateStockWithRetry(
            supabase,
            decrementedTarget.source,
            decrementedTarget.id,
            -decrementedTarget.quantity,
          );
        } catch {
          // Ignore rollback failures, we still clean up the order below.
        }
      }

      await supabase.from("orders").delete().eq("id", createdOrder.id);
      throw stockError;
    }

    return new Response(
      JSON.stringify({ order: createdOrder, reused: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorStatus = error instanceof HttpError ? error.status : 500;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: errorStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
