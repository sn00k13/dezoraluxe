import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaystackWebhookEvent {
  event: string
  data: {
    reference: string
    status: string
    amount: number
    customer: {
      email: string
    }
    metadata?: {
      custom_fields?: Array<{
        variable_name: string
        value: string
      }>
    }
  }
}

class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const getMetadataField = (
  customFields: PaystackWebhookEvent['data']['metadata'] extends { custom_fields?: infer T } ? T : never,
  variableName: string
) => {
  return customFields?.find((field) => field.variable_name === variableName)?.value?.trim() ?? null
}

const maybeApplyDiscountUsage = async (
  supabase: ReturnType<typeof createClient>,
  discountCodeId: string | null | undefined
) => {
  if (!discountCodeId) return

  const { error } = await supabase.rpc('increment_discount_code_usage', {
    p_code_id: discountCodeId,
  })

  if (error) {
    console.error('Failed to increment discount code usage:', error)
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Paystack secret key (only secret we need to set)
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

    if (!paystackSecretKey) {
      console.error('Missing PAYSTACK_SECRET_KEY environment variable')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Paystack secret key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase URL and service role key are automatically available in Edge Functions
    // These are injected by Supabase when the function runs
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials. This should be automatic in Edge Functions.')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const body = await req.text()
    
    // Verify webhook signature
    const signature = req.headers.get('x-paystack-signature')
    if (!signature) {
      console.error('Missing Paystack signature')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify signature using HMAC SHA512
    // Paystack uses HMAC SHA512 to sign webhooks
    const encoder = new TextEncoder()
    const keyData = encoder.encode(paystackSecretKey)
    const bodyData = encoder.encode(body)
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData)
    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (hashHex !== signature) {
      console.error('Invalid webhook signature. Expected:', hashHex, 'Got:', signature)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse webhook event
    const event: PaystackWebhookEvent = JSON.parse(body)

    console.log('Received Paystack event:', event.event)

    // Only process charge.success events
    if (event.event !== 'charge.success') {
      console.log('Ignoring event:', event.event)
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { reference, status, amount, customer, metadata } = event.data

    // Verify payment was successful
    if (status !== 'success') {
      console.log('Payment not successful, status:', status)
      return new Response(
        JSON.stringify({ message: 'Payment not successful' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customFields = metadata?.custom_fields ?? []
    const orderIdFromMetadata = getMetadataField(customFields, 'order_id')
    const orderTokenFromMetadata = getMetadataField(customFields, 'order_token')

    // Check if order already exists with this payment reference
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, status, payment_reference')
      .eq('payment_reference', reference)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking order:', checkError)
      throw checkError
    }

    // If order exists and is already processed, return success
    if (existingOrder && existingOrder.status !== 'pending') {
      console.log('Order already processed:', existingOrder.id)
      return new Response(
        JSON.stringify({ message: 'Order already processed', orderId: existingOrder.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If order exists but is still pending, confirm the reservation.
    if (existingOrder) {
      const { data: confirmationResult, error: confirmationError } = await supabase.rpc(
        'confirm_order_stock_reservations',
        {
          p_order_id: existingOrder.id,
          p_payment_reference: reference,
        }
      )

      if (confirmationError) {
        throw confirmationError
      }

      if (
        confirmationResult &&
        typeof confirmationResult === 'object' &&
        confirmationResult.just_confirmed === true
      ) {
        await maybeApplyDiscountUsage(supabase, confirmationResult.discount_code_id)
      }

      console.log('Order updated to processing:', existingOrder.id)
      return new Response(
        JSON.stringify({ 
          message: 'Order updated successfully', 
          orderId: existingOrder.id,
          status: 'processing'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (orderIdFromMetadata) {
      const { data: metadataOrder, error: metadataOrderError } = await supabase
        .from('orders')
        .select('id, status, payment_reference, idempotency_key')
        .eq('id', orderIdFromMetadata)
        .maybeSingle<{
          id: string
          status: string
          payment_reference: string | null
          idempotency_key: string
        }>()

      if (metadataOrderError) {
        throw metadataOrderError
      }

      if (!metadataOrder) {
        throw new HttpError('No matching order found for webhook metadata', 404)
      }

      if (
        orderTokenFromMetadata &&
        metadataOrder.idempotency_key !== orderTokenFromMetadata
      ) {
        throw new HttpError('Webhook order token did not match the stored order', 400)
      }

      const { data: confirmationResult, error: confirmationError } = await supabase.rpc(
        'confirm_order_stock_reservations',
        {
          p_order_id: metadataOrder.id,
          p_payment_reference: reference,
        }
      )

      if (confirmationError) {
        const message = confirmationError.message ?? 'Failed to confirm order'
        if (/reservation|payment confirmation|stock/i.test(message)) {
          throw new HttpError(message, 409)
        }
        throw confirmationError
      }

      if (
        confirmationResult &&
        typeof confirmationResult === 'object' &&
        confirmationResult.just_confirmed === true
      ) {
        await maybeApplyDiscountUsage(supabase, confirmationResult.discount_code_id)
      }

      return new Response(
        JSON.stringify({
          message: 'Order confirmed from webhook metadata',
          orderId: metadataOrder.id,
          status: 'processing',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no order found, log it for investigation.
    console.log('No matching order found for payment reference:', reference, 'customer:', customer.email)
    return new Response(
      JSON.stringify({ 
        message: 'Webhook received but no matching order found.',
        reference 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    const status = error instanceof HttpError ? error.status : 500
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

