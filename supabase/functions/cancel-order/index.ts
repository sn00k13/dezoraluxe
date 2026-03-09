import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CancelOrderPayload = {
  orderId: string;
  idempotencyKey: string;
};

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new HttpError("Server configuration error: missing Supabase credentials", 500);
    }

    const payload = (await req.json()) as CancelOrderPayload;

    if (!payload?.orderId || !payload?.idempotencyKey) {
      throw new HttpError("Missing order cancellation payload", 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, idempotency_key")
      .eq("id", payload.orderId)
      .eq("idempotency_key", payload.idempotencyKey)
      .maybeSingle<{
        id: string;
        status: string;
        idempotency_key: string;
      }>();

    if (orderError) {
      throw orderError;
    }

    if (!order) {
      throw new HttpError("Order not found for cancellation", 404);
    }

    const { data: cancellationResult, error: cancellationError } = await supabase.rpc(
      "cancel_order_stock_reservations",
      {
        p_order_id: payload.orderId,
      },
    );

    if (cancellationError) {
      const message = cancellationError.message ?? "Failed to cancel order";
      if (/cannot be cancelled|paid or fulfilled/i.test(message)) {
        throw new HttpError(message, 409);
      }
      throw cancellationError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        cancellation:
          cancellationResult && typeof cancellationResult === "object"
            ? cancellationResult
            : null,
      }),
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
