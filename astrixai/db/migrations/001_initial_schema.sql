-- Initial schema for Astrix AI - Autonomous B2B Revenue Recovery Agent
-- Created: 2026-09-15

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    plan_type VARCHAR(20) CHECK (plan_type IN ('hook', 'solo', 'agency')),
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    payment_gateway_choice VARCHAR(20) CHECK (payment_gateway_choice IN ('stripe', 'razorpay')),
    api_keys TEXT,
    ai_tone_prompt TEXT,
    custom_domain VARCHAR(255),
    PRIMARY KEY (user_id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    due_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'paused', 'disputed')),
    last_chased_at TIMESTAMP WITH TIME ZONE
);

-- Reminder logs table
CREATE TABLE IF NOT EXISTS reminder_logs (
    log_id UUID PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_content TEXT,
    decline_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_settings_user ON settings(user_id);
