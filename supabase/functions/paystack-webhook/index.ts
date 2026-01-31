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

    // If order exists but is still pending, update it to processing
    if (existingOrder) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id)

      if (updateError) {
        console.error('Error updating order:', updateError)
        throw updateError
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

    // If order doesn't exist, try to find a pending order by email
    // This handles cases where webhook arrives before client-side order creation
    const { data: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    if (pendingError) {
      console.error('Error finding pending orders:', pendingError)
    }

    // Try to match by user email if we have pending orders
    if (pendingOrders && pendingOrders.length > 0) {
      // Get user by email to match orders
      const { data: userData } = await supabase.auth.admin.listUsers()
      const user = userData?.users.find(u => u.email === customer.email)
      
      if (user) {
        // Find pending order for this user
        const userPendingOrder = pendingOrders.find(o => o.user_id === user.id)
        
        if (userPendingOrder) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_reference: reference,
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', userPendingOrder.id)

          if (!updateError) {
            console.log('Order updated with payment reference:', userPendingOrder.id)
            return new Response(
              JSON.stringify({ 
                message: 'Order updated successfully', 
                orderId: userPendingOrder.id 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      }
    }

    // If no order found, log it (order should be created client-side)
    console.log('No matching order found for payment reference:', reference)
    return new Response(
      JSON.stringify({ 
        message: 'Webhook received but no matching order found. Order will be created client-side.',
        reference 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

