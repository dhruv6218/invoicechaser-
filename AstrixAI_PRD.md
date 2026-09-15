# Product Requirements Document (PRD)
## Astrix AI – Autonomous B2B Revenue Recovery Agent

### 1. Executive Summary

**Product Name:** Astrix AI
**Tagline:** Autonomous B2B Revenue Recovery Agent
**Platform:** Responsive Web App + Progressive Web App (PWA)
**Core Value Proposition:** Helps freelancers and small agencies recover overdue invoices autonomously using AI tone cloning and 1-click checkout links.

---

### 2. Target Audience & Pricing Model

| Tier | Plan | Price | Features |
|------|------|-------|----------|
| **Hook** | Free | $0 | First 3 successful invoice recoveries (outcome-based trial) |
| **Solo** | Paid | $29/month | Unlimited tracking, AI tone cloning, 1 connected gateway |
| **Agency** | Paid | $99/month | Unlimited tracking, multi-user access, white-label custom sending domain |

**Payment Processing:** Managed via Dodo Payments (subscription billing).

---

### 3. Technology Stack

#### Frontend & Framework
- **Framework:** Next.js (App Router)
- **React:** Version 19.x
- **UI Library:** Tailwind CSS
- **State Management:** Zustand (for context preservation)
- **Routing:** Next.js App Router

#### Backend & Database
- **Database:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Hosting & Deployment:** Vercel (Edge Functions, Cron Jobs)
- **AI Integration:** OpenAI / Anthropic API (Tone Cloning & Draft Generation)
- **Transactional Email:** Resend or Postmark (email sending)
- **Subscription (MoR):** Dodo Payments
- **Payment Gateways:** Stripe (OAuth/API keys), Razorpay (API keys), Custom Static Links

#### Infrastructure
- **CI/CD:** GitHub Actions (via Vercel integration)
- **Monitoring:** Sentry (error tracking)
- **Deployment:** Vercel Edge Functions for cron jobs

---

### 4. Database Architecture (Supabase Schema)

#### Tables

1. **users**
   - `user_id` (UUID, PK)
   - `email` (string, unique)
   - `plan_type` (enum: hook, solo, agency)
   - `credits_used` (integer)
   - `created_at` (timestamp)

2. **settings**
   - `user_id` (FK to users)
   - `payment_gateway_choice` (string: stripe, razorpay)
   - `api_keys` (encrypted)
   - `ai_tone_prompt` (text)
   - `custom_domain` (string, nullable – for Agency plan)

3. **invoices**
   - `invoice_id` (UUID, PK)
   - `user_id` (FK to users)
   - `client_name` (string)
   - `client_email` (string)
   - `amount` (decimal)
   - `currency` (string)
   - `due_date` (date)
   - `status` (enum: pending, paid, paused, disputed)
   - `last_chased_at` (timestamp)

4. **reminder_logs**
   - `log_id` (UUID, PK)
   - `invoice_id` (FK to invoices)
   - `sent_at` (timestamp)
   - `email_content` (text)
   - `decline_reason` (text, nullable)

---

### 5. User Flows & Application Structure

#### A. Marketing & Legal Pages (Public)
- **Landing Page:** Hero section, 3 core features (Tone cloning, 1-click checkout, Smart decline handling), Pricing table, FAQ.
- **Pages:** `/privacy`, `/terms`, `/refund`, `/contact` (mandatory footer pages for payment gateway approval).

#### B. Authentication & Onboarding
1. **Passwordless Login:** Via Supabase Auth (magic link).
2. **Step 1:** Connect Payment Gateway (Stripe, Razorpay, or paste static URL/UPI).
3. **Step 2:** AI Tone Setup – User pastes 2 old emails, AI saves custom system prompt.
4. **Step 3:** First Invoice Sync / Manual Upload.

#### C. User Dashboard (`/dashboard`)
- **Overview Tab (The Money Screen):**
  - Metrics: Total Recovered, Currently Outstanding, Active Chases
  - Activity Feed (e.g., "AI sent a nudge to John Doe")
- **Action Center (Invoices Tab):**
  - List of overdue invoices with AI Status Tags (Nudge Sent, Escalated, Paid)
  - "Pause AI" button next to each invoice for manual override
- **Tone Studio:**
  - Text input to retrain AI
  - "Generate Preview" button to test current email writing style
  - Tone Escalation Slider (Level 1: Friendly → Level 3: Firm)
- **Settings & Integrations:**
  - Connect/Disconnect Gateways
  - Subscription management (upgrade to Pro via Dodo Payments)

#### D. Admin Panel (`/admin`)
- **User Management:** View all users, block/suspend, manually add free credits
- **Impersonation:** "Login as User" capability for secure debugging
- **System Health:** Track AI API token usage and transactional email costs

---

### 6. Core System Automations & Logic

#### Daily Chase Engine (Vercel Cron Job)
- Runs daily at 09:00 AM UTC
- Scans `invoices` table for `status == 'pending'` and `due_date < TODAY`
- **Frequency Guardrail:** Ensures `last_chased_at` is at least 3–5 days ago to prevent spamming clients
- Triggers AI to draft email based on user's saved Tone Prompt
- Generates dynamic 1-Click Checkout Link (Stripe/Razorpay) embedded in the email
- Sends email via Resend API

#### Smart Decline & Dispute Handling
- **Decline Logic:** If client payment fails, webhook receives error code.
  - *Soft Decline:* Silent background retry
  - *Hard Decline:* Immediate AI email with "Fix your card" link
- **Dispute Button:** Every sent email contains footer link: "Already paid? Click here."
  - Clicking updates invoice status to `disputed`/`paused` and alerts freelancer

#### Payment Reconciliation (Webhooks)
- When client successfully pays via generated Stripe/Razorpay link, webhook hits `/api/webhooks/payment-success`
- System matches Invoice ID, updates status to `paid`
- Instantly halts all future cron-job reminders for that invoice

---

### 7. UX/UI Launch Requirements (19-Point Standard)

| Requirement | Description |
|-------------|-------------|
| **Empty States** | Friendly illustrations when no overdue invoices exist |
| **Loading States** | Skeleton loaders for dashboard data fetching; spinners for AI generation |
| **Error States** | Toast notifications for invalid API keys or failed syncs |
| **Network States** | "You are offline" top banner detection |
| **Responsiveness** | Full mobile optimization via Tailwind CSS (PWA ready) |
| **Accessibility** | ARIA labels on all payment and pause buttons |
| **Crash Reporting** | Sentry integrated for frontend and edge function error tracking |
| **Data Persistence** | Context API / Zustand for tab-switching data retention |

---

### 8. Success Metrics

- **Primary KPI:** Percentage of overdue invoices recovered per month
- **Secondary KPIs:** Customer churn rate, average recovery time, NPS score
- **Business Goals:** Achieve 80%+ recovery rate within 30 days of onboarding

---

### 9. Implementation Roadmap

1. **Phase 1 (MVP)** – Core dashboard, onboarding flow, basic AI tone cloning
2. **Phase 2** – Daily chase engine, smart decline handling, dispute management
3. **Phase 3** – Admin panel, advanced analytics, enterprise features
4. **Phase 4** – Multi-language support, enhanced AI capabilities, marketplace integrations

---

*Document Version: 1.0*
*Last Updated: 2026-09-15*
*Status: Ready for Development*
