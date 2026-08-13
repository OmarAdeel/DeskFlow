-- ==========================================
-- UNIFIED WORKSPACE PLATFORM DATABASE SCHEMA
-- PostgreSQL / Relational Schema Definition
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS & RBAC GOVERNANCE
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'Standard User', -- 'Super Admin', 'Admin', 'Manager', 'Standard User', 'Guest'
  title VARCHAR(128),
  phone VARCHAR(64),
  avatar_url TEXT,
  status VARCHAR(32) DEFAULT 'active', -- 'active', 'suspended', 'invited'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1b. AI AGENTS (created and managed by super admins)
CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  model VARCHAR(128) NOT NULL DEFAULT 'gpt-4o-mini',
  api_base_url TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
  encrypted_api_key TEXT NOT NULL,
  job_details TEXT NOT NULL,
  personality TEXT NOT NULL,
  can_read_organizations BOOLEAN NOT NULL DEFAULT TRUE,
  can_read_public_threads BOOLEAN NOT NULL DEFAULT TRUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CHANNELS & MEMBERSHIPS
CREATE TABLE IF NOT EXISTS channels (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS channel_memberships (
  channel_id VARCHAR(64) REFERENCES channels(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (channel_id, user_id)
);

-- 3. MESSAGES & THREADS
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  channel_id VARCHAR(64) REFERENCES channels(id) ON DELETE CASCADE,
  sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_message_id VARCHAR(64) REFERENCES messages(id) ON DELETE CASCADE, -- For threaded replies
  attachments JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS threads (
  id VARCHAR(64) PRIMARY KEY,
  root_message_id VARCHAR(64) REFERENCES messages(id) ON DELETE CASCADE,
  channel_id VARCHAR(64) REFERENCES channels(id) ON DELETE CASCADE,
  reply_count INT DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TASKS ENGINE (FOLLOWERS)
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(32) DEFAULT 'todo', -- 'todo', 'in_progress', 'completed', 'blocked'
  priority VARCHAR(32) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  creator_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  assignee_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL, -- "Follower"
  due_date TIMESTAMP WITH TIME ZONE,
  source_message_id VARCHAR(64) REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id VARCHAR(255),
  title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(128) NOT NULL DEFAULT 'UTC',
  location TEXT,
  meeting_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS calendar_events_owner_range_idx ON calendar_events(owner_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS calendar_events_organization_range_idx ON calendar_events(organization_id, start_at, end_at);

-- 5. CONTACTS DIRECTORY & CRM DEALS
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(64),
  organization VARCHAR(255),
  social_handles JSONB DEFAULT '{}'::jsonb, -- e.g. {"whatsapp": "+1...", "instagram": "@user"}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  contact_id VARCHAR(64) REFERENCES contacts(id) ON DELETE CASCADE,
  value NUMERIC(12, 2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'USD',
  stage VARCHAR(64) DEFAULT 'Lead', -- 'Lead', 'Contacted', 'Proposal', 'Won', 'Lost'
  assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. OMNICHANNEL INTEGRATIONS & MAIL ACCOUNTS
CREATE TABLE IF NOT EXISTS social_accounts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(64) NOT NULL, -- 'whatsapp', 'instagram', 'facebook', 'messenger'
  account_name VARCHAR(255) NOT NULL,
  webhook_url TEXT,
  access_token TEXT,
  status VARCHAR(32) DEFAULT 'connected',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mail_accounts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,
  provider VARCHAR(64) NOT NULL, -- 'google', 'microsoft', 'imap'
  oauth_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CANVASES & GLOBAL FILES
CREATE TABLE IF NOT EXISTS canvases (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  channel_id VARCHAR(64) REFERENCES channels(id) ON DELETE CASCADE, -- NULL for standalone canvas
  creator_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SYSTEM AUDIT LOG (SUPER ADMIN GOVERNANCE)
CREATE TABLE IF NOT EXISTS system_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(128) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. GLOBAL FILES VAULT
CREATE TABLE IF NOT EXISTS file_assets (
  id VARCHAR(64) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_url TEXT NOT NULL,
  uploader_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(64) NOT NULL, -- 'channel', 'dm', 'task', 'email'
  source_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. BOT & AUTOMATION WEBHOOKS
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  event_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  secret_key VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
