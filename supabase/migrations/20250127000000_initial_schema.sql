-- ============================================================================
-- ADVERIX AI - Complete Database Schema for Supabase
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to create all tables
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Profiles created on signup"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Trial Information
    trial_status TEXT DEFAULT 'active' CHECK (trial_status IN ('active', 'expired', 'converted')),
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Stripe Information
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    
    -- Subscription Status
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN (
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
    )),
    
    -- Plan Information
    plan_id TEXT DEFAULT 'trial' CHECK (plan_id IN ('trial', 'starter', 'pro', 'business', 'enterprise')),
    plan_name TEXT DEFAULT 'Free Trial',
    
    -- Usage Limits
    monthly_messages_limit INTEGER DEFAULT 100,
    monthly_calls_limit INTEGER DEFAULT 10,
    
    -- Current Usage (reset monthly)
    messages_used INTEGER DEFAULT 0,
    calls_used INTEGER DEFAULT 0,
    usage_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Billing Period
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends ON subscriptions(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access subscriptions"
    ON subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create subscription on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id)
    VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================================================
-- 3. PLAN LIMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id TEXT NOT NULL UNIQUE,
    plan_name TEXT NOT NULL,
    monthly_messages INTEGER NOT NULL,
    monthly_calls INTEGER NOT NULL,
    features JSONB DEFAULT '{}',
    price_monthly INTEGER NOT NULL,  -- in cents
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plan_limits (plan_id, plan_name, monthly_messages, monthly_calls, price_monthly, features) VALUES
('trial', 'Free Trial', 100, 10, 0, '{"duration_days": 7}'),
('starter', 'Starter', 500, 50, 4900, '{"whatsapp": true, "voice": true}'),
('pro', 'Pro', 2000, 200, 9900, '{"whatsapp": true, "voice": true, "priority_support": true}'),
('business', 'Business', 10000, 1000, 19900, '{"whatsapp": true, "voice": true, "priority_support": true, "custom_integrations": true}'),
('enterprise', 'Enterprise', -1, -1, 0, '{"unlimited": true, "sla": true, "dedicated_support": true}')
ON CONFLICT (plan_id) DO NOTHING;

-- ============================================================================
-- 4. AGENT CONFIGURATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Basic Settings
    agent_name TEXT NOT NULL DEFAULT 'My AI Assistant',
    business_name TEXT,
    business_type TEXT,
    
    -- Retell AI Integration
    retell_agent_id TEXT,
    retell_phone_number TEXT,
    
    -- Universal Prompt
    universal_prompt TEXT,
    
    -- Speech Settings
    voice_provider TEXT DEFAULT 'retell',
    voice_id TEXT DEFAULT 'zara',
    speech_speed DECIMAL(3,2) DEFAULT 1.0,
    language TEXT DEFAULT 'en-US',
    interruption_sensitivity TEXT DEFAULT 'medium' CHECK (interruption_sensitivity IN ('low', 'medium', 'high')),
    
    -- Call Settings
    max_call_duration INTEGER DEFAULT 600,
    enable_recording BOOLEAN DEFAULT true,
    enable_transcription BOOLEAN DEFAULT true,
    enable_voicemail BOOLEAN DEFAULT false,
    voicemail_message TEXT,
    
    -- Business Information
    business_phone TEXT,
    business_email TEXT,
    business_address TEXT,
    business_hours JSONB DEFAULT '{}',
    services JSONB DEFAULT '[]',
    
    -- Knowledge Base
    faqs JSONB DEFAULT '[]',
    custom_instructions TEXT,
    
    -- Post-Call Settings
    send_transcript_email BOOLEAN DEFAULT true,
    send_summary_sms BOOLEAN DEFAULT false,
    notification_email TEXT,
    
    -- Webhook Settings
    webhook_url TEXT,
    webhook_secret TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_configurations_user_id ON agent_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_retell_agent_id ON agent_configurations(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_is_active ON agent_configurations(is_active);

-- RLS
ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent configuration"
    ON agent_configurations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent configuration"
    ON agent_configurations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent configuration"
    ON agent_configurations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access agent_configurations"
    ON agent_configurations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger
CREATE TRIGGER update_agent_configurations_updated_at
    BEFORE UPDATE ON agent_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create agent configuration on subscription creation
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.agent_configurations (user_id)
    VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_subscription_created ON subscriptions;
CREATE TRIGGER on_subscription_created
    AFTER INSERT ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- ============================================================================
-- 5. WHATSAPP CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- WhatsApp Business Account Info
    phone_number TEXT NOT NULL,
    phone_number_id TEXT,
    waba_id TEXT,
    
    -- API Credentials
    access_token TEXT,
    
    -- Webhook Configuration
    webhook_verify_token TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'verifying',
        'active',
        'disconnected',
        'error'
    )),
    
    -- Last Activity
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    
    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_tenant ON whatsapp_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_connections(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_id ON whatsapp_connections(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status ON whatsapp_connections(status);

-- RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whatsapp connection"
    ON whatsapp_connections FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Users can manage own whatsapp connection"
    ON whatsapp_connections FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access whatsapp"
    ON whatsapp_connections FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger
CREATE TRIGGER update_whatsapp_connections_updated_at
    BEFORE UPDATE ON whatsapp_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. CALENDAR CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Cal.com Info
    calcom_api_key TEXT,
    calcom_event_type_id TEXT,
    calcom_username TEXT,
    
    -- Settings
    default_duration INTEGER DEFAULT 30,
    buffer_before INTEGER DEFAULT 0,
    buffer_after INTEGER DEFAULT 0,
    
    -- Status
    is_connected BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_tenant ON calendar_connections(tenant_id);

-- RLS
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar connection"
    ON calendar_connections FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access calendar"
    ON calendar_connections FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 7. CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Channel Info
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'voice', 'email')),
    
    -- Customer Info
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    customer_wa_id TEXT,
    customer_email TEXT,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_human', 'resolved', 'closed')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Unique active conversation per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_active 
    ON conversations(tenant_id, customer_phone, channel) 
    WHERE status = 'active';

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
    ON conversations FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access conversations"
    ON conversations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Message Content
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location')),
    
    -- External IDs
    wa_message_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
    
    -- AI Info
    ai_generated BOOLEAN DEFAULT false,
    ai_model TEXT,
    ai_tokens_used INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id ON messages(wa_message_id);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages"
    ON messages FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access messages"
    ON messages FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 9. CALLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Call Info
    call_id TEXT NOT NULL UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    customer_phone TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
        'initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy'
    )),
    
    -- Call Data
    duration INTEGER DEFAULT 0,
    transcript TEXT,
    summary TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    recording_url TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calls_conversation ON calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_tenant ON calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_id ON calls(call_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created ON calls(created_at DESC);

-- RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calls"
    ON calls FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access calls"
    ON calls FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 10. APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Customer Info
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    
    -- Appointment Info
    service TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30,
    
    -- External References
    calcom_booking_id TEXT,
    calcom_booking_uid TEXT,
    
    -- Source
    source TEXT CHECK (source IN ('whatsapp', 'voice', 'web', 'manual')),
    conversation_id UUID REFERENCES conversations(id),
    
    -- Status
    status TEXT DEFAULT 'confirmed' CHECK (status IN (
        'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
    )),
    
    -- Notes
    notes TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_phone);

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own appointments"
    ON appointments FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access appointments"
    ON appointments FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. KNOWLEDGE EMBEDDINGS TABLE (Vector Database)
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    embedding vector(1536),
    
    -- Classification
    source_type TEXT NOT NULL CHECK (source_type IN (
        'business_info',
        'service',
        'faq',
        'working_hours',
        'policy',
        'conversation',
        'custom'
    )),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    source_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ke_tenant ON knowledge_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ke_source_type ON knowledge_embeddings(source_type);
CREATE INDEX IF NOT EXISTS idx_ke_created ON knowledge_embeddings(created_at DESC);

-- Vector index (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_ke_embedding ON knowledge_embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- RLS
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own embeddings"
    ON knowledge_embeddings FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access embeddings"
    ON knowledge_embeddings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 12. RAG SEARCH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION search_knowledge(
    p_tenant_id UUID,
    p_query_embedding vector(1536),
    p_source_types TEXT[] DEFAULT NULL,
    p_limit INT DEFAULT 5,
    p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_type TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ke.id,
        ke.content,
        ke.source_type,
        (1 - (ke.embedding <=> p_query_embedding))::FLOAT as similarity,
        ke.metadata
    FROM knowledge_embeddings ke
    WHERE ke.tenant_id = p_tenant_id
      AND (p_source_types IS NULL OR ke.source_type = ANY(p_source_types))
      AND (1 - (ke.embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY ke.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. CONVERSATION SUMMARIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    
    -- Customer Info
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    
    -- Summary
    summary TEXT NOT NULL,
    key_points JSONB DEFAULT '[]',
    topics TEXT[],
    overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'neutral', 'negative')),
    outcome TEXT CHECK (outcome IN ('appointment_booked', 'question_answered', 'transferred_to_human', 'unresolved')),
    
    -- Embedding Reference
    embedded BOOLEAN DEFAULT false,
    embedding_id UUID REFERENCES knowledge_embeddings(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_tenant ON conversation_summaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_customer ON conversation_summaries(customer_phone);
CREATE INDEX IF NOT EXISTS idx_cs_conversation ON conversation_summaries(conversation_id);

-- RLS
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own summaries"
    ON conversation_summaries FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access summaries"
    ON conversation_summaries FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 14. ERROR LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Error Details
    error_type TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    
    -- Context
    workflow_name TEXT,
    conversation_id UUID REFERENCES conversations(id),
    message_id UUID REFERENCES messages(id),
    request_data JSONB,
    
    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_tenant ON error_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(resolved) WHERE resolved = false;

-- RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own errors"
    ON error_logs FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access error_logs"
    ON error_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 15. HANDOFF QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS handoff_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    
    -- Handoff Details
    reason TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Customer Info
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    
    -- Context
    conversation_summary TEXT,
    last_messages JSONB,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'resolved', 'expired')),
    claimed_by TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_handoff_tenant ON handoff_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_handoff_status ON handoff_queue(status);
CREATE INDEX IF NOT EXISTS idx_handoff_priority ON handoff_queue(priority);
CREATE INDEX IF NOT EXISTS idx_handoff_created ON handoff_queue(created_at DESC);

-- RLS
ALTER TABLE handoff_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own handoffs"
    ON handoff_queue FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY "Service role full access handoff"
    ON handoff_queue FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 16. ONBOARDING PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Progress
    current_step INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT false,
    
    -- Collected Data
    business_info JSONB DEFAULT '{}',
    services_info JSONB DEFAULT '[]',
    working_hours JSONB DEFAULT '{}',
    faqs JSONB DEFAULT '[]',
    ai_personality JSONB DEFAULT '{}',
    integrations_status JSONB DEFAULT '{}',
    
    -- Chat History
    chat_history JSONB DEFAULT '[]',
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON onboarding_progress(is_completed);

-- RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own onboarding"
    ON onboarding_progress FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access onboarding"
    ON onboarding_progress FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger
CREATE TRIGGER update_onboarding_updated_at
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create onboarding progress on agent config creation
CREATE OR REPLACE FUNCTION public.handle_new_agent_config()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.onboarding_progress (user_id)
    VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agent_config_created ON agent_configurations;
CREATE TRIGGER on_agent_config_created
    AFTER INSERT ON agent_configurations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_agent_config();

-- ============================================================================
-- 17. EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Info
    template_type TEXT NOT NULL CHECK (template_type IN (
        'appointment_confirmation_customer',
        'appointment_confirmation_owner',
        'appointment_reminder',
        'appointment_cancelled',
        'call_summary',
        'welcome',
        'trial_ending',
        'trial_expired',
        'handoff_notification'
    )),
    
    -- Content
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
    ON email_templates FOR ALL
    USING (auth.uid() = tenant_id OR tenant_id IS NULL);

CREATE POLICY "Service role full access templates"
    ON email_templates FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert default templates
INSERT INTO email_templates (tenant_id, template_type, subject, body_html) VALUES
(NULL, 'welcome', 
 'Welcome to Adverix AI!',
 '<h1>Welcome to Adverix AI!</h1><p>Your 7-day free trial has started.</p>'),
(NULL, 'trial_ending',
 'Your trial ends in 2 days',
 '<h1>Your trial is ending soon</h1><p>Subscribe now to continue using Adverix AI.</p>'),
(NULL, 'trial_expired',
 'Your trial has expired',
 '<h1>Your trial has expired</h1><p>Subscribe to reactivate your AI assistant.</p>'),
(NULL, 'appointment_confirmation_customer',
 'Appointment Confirmed - {{business_name}}',
 '<h1>Appointment Confirmed</h1><p>Date: {{date}}</p><p>Time: {{time}}</p><p>Service: {{service}}</p>'),
(NULL, 'appointment_confirmation_owner',
 'New Appointment - {{customer_name}}',
 '<h1>New Appointment</h1><p>Customer: {{customer_name}}</p><p>Date: {{date}} {{time}}</p>'),
(NULL, 'call_summary',
 'Call Summary - {{customer_phone}}',
 '<h1>Call Summary</h1><p>Duration: {{duration}}</p><p>Summary: {{summary}}</p>'),
(NULL, 'handoff_notification',
 '[ACTION NEEDED] Customer needs assistance',
 '<h1>Human Handoff Required</h1><p>Customer: {{customer_name}}</p><p>Reason: {{reason}}</p>')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE! Your database is ready.
-- ============================================================================

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;





