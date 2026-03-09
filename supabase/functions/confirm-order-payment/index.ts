import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ConfirmOrderPayload = {
  orderId: string;
  idempotencyKey: string;
  paymentReference: string;
};

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const maybeApplyDiscountUsage = async (
  supabase: ReturnType<typeof createClient>,
  discountCodeId: string | null | undefined,
) => {
  if (!discountCodeId) return;

  const { error } = await supabase.rpc("increment_discount_code_usage", {
    p_code_id: discountCodeId,
  });

  if (error) {
    console.error("Failed to increment discount code usage:", error);
  }
};

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

    const payload = (await req.json()) as ConfirmOrderPayload;

    if (!payload?.orderId || !payload?.idempotencyKey || !payload?.paymentReference) {
      throw new HttpError("Missing order confirmation payload", 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, status, idempotency_key")
      .eq("id", payload.orderId)
      .eq("idempotency_key", payload.idempotencyKey)
      .maybeSingle<{
        id: string;
        order_number: string;
        status: string;
        idempotency_key: string;
      }>();

    if (orderError) {
      throw orderError;
    }

    if (!order) {
      throw new HttpError("Order not found for confirmation", 404);
    }

    const { data: confirmationResult, error: confirmationError } = await supabase.rpc(
      "confirm_order_stock_reservations",
      {
        p_order_id: payload.orderId,
        p_payment_reference: payload.paymentReference,
      },
    );

    if (confirmationError) {
      const message = confirmationError.message ?? "Failed to confirm order";
      if (/reservation|payment confirmation|stock/i.test(message)) {
        throw new HttpError(message, 409);
      }
      throw confirmationError;
    }

    if (
      confirmationResult &&
      typeof confirmationResult === "object" &&
      confirmationResult.just_confirmed === true
    ) {
      await maybeApplyDiscountUsage(supabase, confirmationResult.discount_code_id);
    }

    const { data: updatedOrder, error: updatedOrderError } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_reference")
      .eq("id", payload.orderId)
      .single<{
        id: string;
        order_number: string;
        status: string;
        payment_reference: string | null;
      }>();

    if (updatedOrderError) {
      throw updatedOrderError;
    }

    return new Response(
      JSON.stringify({
        order: updatedOrder,
        justConfirmed:
          confirmationResult && typeof confirmationResult === "object"
            ? confirmationResult.just_confirmed === true
            : false,
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
