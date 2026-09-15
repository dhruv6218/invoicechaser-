// Supabase client configuration for Astrix AI
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Client for frontend use (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for backend use (uses service key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export type User = {
  user_id: string
  email: string
  plan_type: 'hook' | 'solo' | 'agency'
  credits_used: number
  created_at: string
  updated_at: string
}

export type Settings = {
  user_id: string
  payment_gateway_choice: 'stripe' | 'razorpay' | 'custom'
  api_keys: any
  ai_tone_prompt: string
  custom_domain: string
  created_at: string
  updated_at: string
}

export type Invoice = {
  invoice_id: string
  user_id: string
  client_name: string
  client_email: string
  amount: number
  currency: string
  due_date: string
  status: 'pending' | 'paid' | 'paused' | 'disputed'
  last_chased_at: string
  created_at: string
  updated_at: string
}

export type ReminderLog = {
  log_id: string
  invoice_id: string
  sent_at: string
  email_content: string
  decline_reason: string
  created_at: string
}
