-- ============================================
-- Astrix AI - Complete Supabase Backend Setup
-- Autonomous B2B Revenue Recovery Agent
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan_type VARCHAR(20) CHECK (plan_type IN ('hook', 'solo', 'agency')) DEFAULT 'hook',
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    payment_gateway_choice VARCHAR(20) CHECK (payment_gateway_choice IN ('stripe', 'razorpay', 'custom')),
    api_keys JSONB,
    ai_tone_prompt TEXT,
    custom_domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    due_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'paused', 'disputed')) DEFAULT 'pending',
    last_chased_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reminder logs table
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE CASCADE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_content TEXT,
    decline_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables for complete functionality

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    plan_type VARCHAR(20) CHECK (plan_type IN ('hook', 'solo', 'agency')) DEFAULT 'hook',
    status VARCHAR(20) CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'trialing',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255),
    dodo_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE NOT NULL,
    gateway VARCHAR(20) CHECK (gateway IN ('stripe', 'razorpay')),
    gateway_customer_id VARCHAR(255),
    gateway_payment_method_id VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan_type);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_due ON public.invoices(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_invoice ON public.reminder_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent ON public.reminder_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "settings_all_own" ON public.settings
    FOR ALL USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "invoices_select_own" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_own" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update_own" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "invoices_delete_own" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Reminder logs policies
CREATE POLICY "reminder_logs_select_own" ON public.reminder_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE invoices.invoice_id = reminder_logs.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "reminder_logs_insert_system" ON public.reminder_logs
    FOR INSERT WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment methods policies
CREATE POLICY "payment_methods_all_own" ON public.payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Email templates policies
CREATE POLICY "email_templates_all_own" ON public.email_templates
    FOR ALL USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dashboard stats function
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID)
RETURNS TABLE (
    total_recovered DECIMAL,
    outstanding_amount DECIMAL,
    active_chases INTEGER,
    total_invoices INTEGER,
    paid_invoices INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total_recovered,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as outstanding_amount,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as active_chases,
        COUNT(*)::INTEGER as total_invoices,
        COUNT(*) FILTER (WHERE status = 'paid')::INTEGER as paid_invoices
    FROM public.invoices
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can create invoice
CREATE OR REPLACE FUNCTION can_create_invoice(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan VARCHAR;
    invoice_count INTEGER;
BEGIN
    SELECT plan_type INTO user_plan FROM public.users WHERE user_id = user_uuid;
    
    IF user_plan IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT COUNT(*) INTO invoice_count FROM public.invoices WHERE user_id = user_uuid;
    
    IF user_plan = 'hook' AND invoice_count >= 3 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logging function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.invoice_id, NEW.user_id, NEW.log_id, NEW.subscription_id),
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_users_changes AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_invoices_changes AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_settings_changes AFTER INSERT OR UPDATE OR DELETE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard view
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
    u.user_id,
    u.email,
    u.plan_type,
    u.credits_used,
    COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as total_recovered,
    COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END), 0) as outstanding_amount,
    COUNT(i.invoice_id) FILTER (WHERE i.status = 'pending') as active_chases,
    COUNT(i.invoice_id) as total_invoices
FROM public.users u
LEFT JOIN public.invoices i ON u.user_id = i.user_id
GROUP BY u.user_id, u.email, u.plan_type, u.credits_used;

-- Overdue invoices view
CREATE OR REPLACE VIEW public.overdue_invoices AS
SELECT 
    i.*,
    u.email as user_email,
    u.plan_type
FROM public.invoices i
JOIN public.users u ON i.user_id = u.user_id
WHERE i.status = 'pending' 
AND i.due_date < CURRENT_DATE
AND (i.last_chased_at IS NULL OR i.last_chased_at < CURRENT_DATE - INTERVAL '3 days');

-- ============================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================

-- Insert sample user (remove in production)
INSERT INTO public.users (user_id, email, plan_type, credits_used) VALUES
(uuid_generate_v4(), 'demo@astrix.ai', 'solo', 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- COMPLETE
-- ============================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Astrix AI Supabase backend setup complete!';
    RAISE NOTICE 'Tables created: users, settings, invoices, reminder_logs, subscriptions, payment_methods, email_templates, audit_logs';
    RAISE NOTICE 'RLS policies enabled on all tables';
    RAISE NOTICE 'Functions and triggers created';
    RAISE NOTICE 'Views created for dashboard and reporting';
END $$;
