# Astrix AI - Supabase Backend Deployment Guide

## Step 1: Configure Supabase Project

### 1.1 Set Environment Variables
Create a `.env` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://shmzffwsljesmqfbvvcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Apply Database Schema

**Option A: Supabase Dashboard (Recommended)**
1. Go to https://app.supabase.com/project/shmzzfvwsljesmqfbvvcw
2. Navigate to SQL Editor
3. Run the complete SQL script from `SUPABASE_FULL_SETUP.sql`
4. Wait for completion

**Option B: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref shmzzfvwsljesmqfbvvcw

# Apply migrations
supabase db push
```

## Step 2: Deploy Edge Functions

### 2.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 2.2 Deploy Functions
```bash
# Link project
supabase link --project-ref shmzzfvwsljesmqfbvvcw

# Deploy all functions
supabase functions deploy daily-chase
supabase functions deploy ai-tone-cloning
supabase functions deploy stripe-webhook

# Set secrets
supabase secrets set SUPABASE_URL=https://shmzffwsljesmqfbvvcw.supabase.co
supabase secrets set SUPABASE_SERVICE_KEY=your-service-key
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set RESEND_API_KEY=your-resend-key
supabase secrets set CRON_SECRET=your-cron-secret
```

## Step 3: Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates
4. Set redirect URLs:
   - Site URL: https://your-app.com
   - Redirect URLs: https://your-app.com/auth/callback

## Step 4: Configure Webhooks

### Stripe Webhook
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://shmzffwsljesmqfbvvcw.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
4. Copy signing secret and add to Supabase secrets

### Dodo Payments Webhook
1. Configure in Dodo Payments dashboard
2. Endpoint: `https://shmzffwsljesmqfbvvcw.supabase.co/functions/v1/dodo-webhook`
3. Verify signatures

## Step 5: Configure Cron Jobs

### Vercel Cron (Recommended)
In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-chase",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Supabase Cron (Alternative)
1. Go to Supabase Dashboard > Database > Cron
2. Create job:
   - Name: daily-chase
   - Schedule: `0 9 * * *`
   - Query: Call daily-chase function

## Step 6: Test the Backend

### Test Database Connection
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://shmzffwsljesmqfbvvcw.supabase.co',
  'your-anon-key'
)

// Test query
const { data, error } = await supabase.from('users').select('*')
console.log(data)
```

### Test Edge Function
```bash
curl -X POST https://shmzffwsljesmqfbvvcw.supabase.co/functions/v1/daily-chase \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Step 7: Configure Storage (Optional)

### Create Storage Buckets
1. Go to Storage > Create bucket
2. Create buckets:
   - `avatars` - User avatars
   - `invoices` - Invoice PDFs
   - `email-templates` - Custom email templates

### Set Bucket Policies
```sql
-- Avatar bucket policy
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Invoice bucket policy
CREATE POLICY "Users can access their own invoices"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 8: Enable Realtime

### Enable Realtime for Tables
1. Go to Database > Replication
2. Enable realtime for:
   - invoices
   - reminder_logs
   - users

### Realtime Client
```javascript
const channel = supabase
  .channel('invoices')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'invoices'
  }, payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

## Step 9: Monitoring and Logging

### Enable Log Drain
1. Go to Project Settings > Logs
2. Configure log drain to external service
3. Enable audit logging

### Set Up Alerts
1. Go to Project Settings > Alerts
2. Configure alerts for:
   - High CPU usage
   - Database errors
   - Edge function errors

## Step 10: Production Checklist

- [ ] Database schema applied
- [ ] Row Level Security enabled
- [ ] Edge functions deployed
- [ ] Authentication configured
- [ ] Webhooks configured
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Custom domain configured
- [ ] SSL certificates verified
- [ ] Load testing completed
- [ ] Security audit passed

## Troubleshooting

### Common Issues

**1. RLS Policy Errors**
```sql
-- Check current RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**2. Edge Function Errors**
- Check logs in Supabase Dashboard > Functions > Logs
- Verify environment variables are set
- Check CORS configuration

**3. Authentication Issues**
- Verify site URL configuration
- Check redirect URLs
- Test with Postman/curl

**4. Database Connection Issues**
- Check database status in dashboard
- Verify connection pool settings
- Test with direct connection

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Supabase Support: https://supabase.com/support

## Security Notes

1. Never expose service key in frontend
2. Rotate API keys regularly
3. Enable 2FA on Supabase account
4. Use HTTPS only
5. Monitor for suspicious activity
6. Regular security audits

---

**Deployment Complete!** Your Astrix AI backend is now ready for production use.
