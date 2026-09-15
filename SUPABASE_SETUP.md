# Astrix AI - Supabase Backend Setup

## Overview
Complete Supabase backend configuration for Astrix AI - Autonomous B2B Revenue Recovery Agent

## Supabase Project Details
- **Project URL:** https://shmzffwsljesmqfbvvcw.supabase.co
- **Project Ref:** shmzzfvwsljesmqfbvvcw
- **Region:** US East

## Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://shmzffwsljesmqfbvvcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobXpmZndzbGplc21xZmJ2dmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxOTk0MjEsImV4cCI6MjEwNDc3NTQyMX0.rRpdeZ4mocxCFHsdBo6jQ0-9dLYdNGiWwVI1q3tur90
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobXpmZndzbGplc21xZmJ2dmN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE5OTQyMSwiZXhwIjoyMTA0Nzc1NDIxfQ.N9jqoGsDtDaIcrKJVKkX7cow1wlSA31WB1OtI8GSLd0

# Database
DATABASE_URL=postgresql://neondb_owner:npg_OYbqhGWA29wp@ep-late-heart-avpbu2oh.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

RESEND_API_KEY=re_...

OPENAI_API_KEY=sk-...

ANTHROPIC_API_KEY=sk-ant-...

DODO_API_KEY=...

CRON_SECRET=your-cron-secret

NEXTAUTH_SECRET=your-secret
```

## Database Schema

### Tables Created

1. **users**
   - user_id (UUID, PK)
   - email (VARCHAR, unique)
   - plan_type (enum: hook, solo, agency)
   - credits_used (INTEGER)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **settings**
   - user_id (UUID, FK, PK)
   - payment_gateway_choice (VARCHAR)
   - api_keys (JSONB)
   - ai_tone_prompt (TEXT)
   - custom_domain (VARCHAR)

3. **invoices**
   - invoice_id (UUID, PK)
   - user_id (UUID, FK)
   - client_name (VARCHAR)
   - client_email (VARCHAR)
   - amount (DECIMAL)
   - currency (VARCHAR)
   - due_date (DATE)
   - status (enum: pending, paid, paused, disputed)
   - last_chased_at (TIMESTAMP)

4. **reminder_logs**
   - log_id (UUID, PK)
   - invoice_id (UUID, FK)
   - sent_at (TIMESTAMP)
   - email_content (TEXT)
   - decline_reason (TEXT)

## Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only access their own data
- System can insert reminder logs
- Admin functions bypass RLS for system operations

## Edge Functions

### 1. Daily Chase Engine
**Path:** `supabase/functions/daily-chase/`
**Schedule:** Daily at 09:00 UTC
**Purpose:** Scan overdue invoices and send AI-generated reminders

### 2. AI Tone Cloning
**Path:** `supabase/functions/ai-tone-cloning/`
**Purpose:** Generate custom AI tone prompts from user email samples

### 3. Stripe Webhook
**Path:** `supabase/functions/stripe-webhook/`
**Purpose:** Handle payment success/failure events

## Authentication

### Passwordless Magic Links
- Supabase Auth configured for magic link authentication
- No passwords required
- Secure token-based authentication

### User Flow
1. User enters email
2. Magic link sent via email
3. User clicks link and is authenticated
4. Session persists for 30 days

## Database Migrations

To apply schema changes:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref shmzzfvwsljesmqfbvvcw

# Run migrations
supabase db push
```

## Storage

Supabase Storage can be configured for:
- User avatars
- Invoice PDF uploads
- Custom email templates

## Real-time Subscriptions

Enable real-time updates for:
- Invoice status changes
- Payment notifications
- New reminder logs

## Security Best Practices

1. **API Keys:** Never expose service key in frontend
2. **RLS:** All tables have Row Level Security enabled
3. **CORS:** Configure allowed origins properly
4. **Rate Limiting:** Implement in Edge Functions
5. **Audit Logging:** All changes tracked in reminder_logs

## Testing

### Test Database Connection
```javascript
import { supabase } from './lib/supabase'

const { data, error } = await supabase.from('users').select('*')
```

### Test Edge Function
```bash
supabase functions invoke daily-chase --no-verify-jwt
```

## Production Checklist

- [ ] Database migration applied
- [ ] RLS policies tested
- [ ] Environment variables configured
- [ ] Edge functions deployed
- [ ] Webhooks configured
- [ ] Custom domain set
- [ ] SSL certificates verified
- [ ] Backup strategy implemented
- [ ] Monitoring set up
- [ ] Rate limiting configured

## Support

For issues with Supabase:
- Documentation: https://supabase.com/docs
- Support: https://supabase.com/support
- Discord: https://discord.supabase.com

## Next Steps

1. Deploy database schema to Supabase
2. Configure authentication settings
3. Deploy Edge Functions
4. Test with sample data
5. Set up monitoring and alerts
