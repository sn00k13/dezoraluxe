# Paystack Webhook Edge Function

This Edge Function handles Paystack webhook events to verify payments server-side.

## Quick Deploy

**Note:** Use `npx supabase` if you haven't installed Supabase CLI globally.

```bash
# 1. Login to Supabase (using npx - no installation needed)
npx supabase login

# 2. Link your project
npx supabase link --project-ref your-project-ref

# 3. Set Paystack secret (Supabase credentials are automatic)
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_key

# Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available
# You don't need to set them - Supabase injects them automatically

# 4. Deploy
npx supabase functions deploy paystack-webhook

# Or use npm scripts:
npm run supabase:deploy:webhook
```

## Get Webhook URL

After deployment, your webhook URL will be:
```
https://your-project-ref.supabase.co/functions/v1/paystack-webhook
```

Add this URL in Paystack Dashboard → Settings → API Keys & Webhooks

## View Logs

```bash
# View logs (using npm scripts)
npm run supabase:logs:webhook

# Follow logs in real-time
npm run supabase:logs:webhook:follow

# Or directly with npx:
npx supabase functions logs paystack-webhook
npx supabase functions logs paystack-webhook --follow
```

## Testing

1. Make a test payment using Paystack test card: `4084084084084081`
2. Check logs to see webhook events
3. Verify order status updated in Supabase dashboard

