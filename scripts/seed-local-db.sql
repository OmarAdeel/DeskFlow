-- Local-only demo data for the unified workspace schema.
-- This intentionally resets the local database so the seed is repeatable.

BEGIN;

TRUNCATE TABLE
  webhook_endpoints,
  file_assets,
  system_audit_logs,
  canvases,
  mail_accounts,
  social_accounts,
  deals,
  contacts,
  tasks,
  threads,
  messages,
  channel_memberships,
  channels,
  users
RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, email, role, title, phone, avatar_url, status) VALUES
  ('usr_abdallah', 'Abdallah Sayed', 'abdallah@democompany.com', 'Super Admin', 'CEO', '+1-555-0100', 'https://i.pravatar.cc/150?u=abdallah', 'active'),
  ('usr_john', 'John Doe', 'john.doe@democompany.com', 'Standard User', 'Product Engineer', '+1-555-0101', 'https://i.pravatar.cc/150?u=john', 'active'),
  ('usr_esraa', 'Esraa Soliman', 'esraa@democompany.com', 'Manager', 'Customer Operations Manager', '+1-555-0102', 'https://i.pravatar.cc/150?u=esraa', 'active'),
  ('usr_sarah', 'Sarah Chen', 'sarah@democompany.com', 'Admin', 'Support Lead', '+1-555-0103', 'https://i.pravatar.cc/150?u=sarah', 'active'),
  ('usr_omar', 'Omar Hassan', 'omar.hitman2010@gmail.com', 'Super Admin', 'UX Designer', '+1-555-0104', 'https://i.pravatar.cc/150?u=omar', 'active'),
  ('usr_guest', 'Demo Guest', 'guest@democompany.com', 'Guest', 'Partner', NULL, 'https://i.pravatar.cc/150?u=guest', 'invited');

INSERT INTO channels (id, name, description, is_private, created_by) VALUES
  ('chn_general', 'general', 'Company-wide announcements and everyday conversation.', FALSE, 'usr_abdallah'),
  ('chn_product', 'product', 'Product planning, launches, and customer feedback.', FALSE, 'usr_john'),
  ('chn_customer_ops', 'customer-ops', 'Support escalations and customer operations.', FALSE, 'usr_esraa'),
  ('chn_leadership', 'leadership', 'Private leadership planning and decisions.', TRUE, 'usr_abdallah');

INSERT INTO channel_memberships (channel_id, user_id) VALUES
  ('chn_general', 'usr_abdallah'), ('chn_general', 'usr_john'), ('chn_general', 'usr_esraa'), ('chn_general', 'usr_sarah'), ('chn_general', 'usr_omar'),
  ('chn_product', 'usr_abdallah'), ('chn_product', 'usr_john'), ('chn_product', 'usr_omar'),
  ('chn_customer_ops', 'usr_abdallah'), ('chn_customer_ops', 'usr_esraa'), ('chn_customer_ops', 'usr_sarah'),
  ('chn_leadership', 'usr_abdallah'), ('chn_leadership', 'usr_esraa'), ('chn_leadership', 'usr_sarah');

INSERT INTO messages (id, channel_id, sender_id, content, attachments, is_pinned, created_at) VALUES
  ('msg_general_welcome', 'chn_general', 'usr_abdallah', 'Welcome to the Demo Company workspace! Please share updates and wins here.', '[]'::jsonb, TRUE, '2026-08-01T09:00:00Z'),
  ('msg_product_launch', 'chn_product', 'usr_john', 'The new workspace navigation prototype is ready for review.', '[{"name":"navigation-preview.png","type":"image/png"}]'::jsonb, FALSE, '2026-08-03T14:30:00Z'),
  ('msg_ops_escalation', 'chn_customer_ops', 'usr_sarah', 'The Acme billing escalation is resolved. I added the follow-up checklist below.', '[]'::jsonb, TRUE, '2026-08-04T11:15:00Z'),
  ('msg_leadership_plan', 'chn_leadership', 'usr_esraa', 'Quarterly planning review is scheduled for Friday at 10:00.', '[]'::jsonb, FALSE, '2026-08-05T16:00:00Z');

INSERT INTO messages (id, channel_id, sender_id, content, parent_message_id, attachments, is_pinned, created_at) VALUES
  ('msg_product_reply', 'chn_product', 'usr_omar', 'I will review the responsive states and leave notes by tomorrow.', 'msg_product_launch', '[]'::jsonb, FALSE, '2026-08-03T15:05:00Z'),
  ('msg_ops_reply', 'chn_customer_ops', 'usr_esraa', 'Thanks Sarah. I will confirm the customer handoff and close the task.', 'msg_ops_escalation', '[]'::jsonb, FALSE, '2026-08-04T11:35:00Z');

INSERT INTO threads (id, root_message_id, channel_id, reply_count, last_reply_at) VALUES
  ('thd_product_launch', 'msg_product_launch', 'chn_product', 1, '2026-08-03T15:05:00Z'),
  ('thd_ops_escalation', 'msg_ops_escalation', 'chn_customer_ops', 1, '2026-08-04T11:35:00Z');

INSERT INTO tasks (id, title, description, status, priority, creator_id, assignee_id, due_date, source_message_id) VALUES
  ('tsk_navigation_review', 'Review navigation prototype', 'Check desktop and mobile states and consolidate feedback.', 'in_progress', 'high', 'usr_john', 'usr_omar', '2026-08-08T17:00:00Z', 'msg_product_launch'),
  ('tsk_acme_handoff', 'Complete Acme billing handoff', 'Share the resolved escalation summary with the account owner.', 'todo', 'urgent', 'usr_sarah', 'usr_esraa', '2026-08-07T17:00:00Z', 'msg_ops_escalation'),
  ('tsk_quarterly_plan', 'Prepare quarterly planning notes', 'Collect team metrics and add decisions to the leadership canvas.', 'completed', 'medium', 'usr_abdallah', 'usr_sarah', '2026-08-05T12:00:00Z', 'msg_leadership_plan');

INSERT INTO contacts (id, name, email, phone, organization, social_handles, notes) VALUES
  ('con_acme', 'Maya Patel', 'maya.patel@acme.example', '+1-555-0200', 'Acme Corporation', '{"whatsapp":"+1-555-0200","linkedin":"maya-patel"}'::jsonb, 'Primary contact for the billing expansion.'),
  ('con_northstar', 'Liam Brooks', 'liam.brooks@northstar.example', '+1-555-0201', 'Northstar Labs', '{"instagram":"@northstarlabs"}'::jsonb, 'Interested in the enterprise workspace plan.'),
  ('con_greenfield', 'Nora Williams', 'nora@greenfield.example', '+1-555-0202', 'Greenfield Health', '{}'::jsonb, 'Requested a security and compliance overview.');

INSERT INTO deals (id, title, contact_id, value, currency, stage, assigned_to) VALUES
  ('deal_acme_expansion', 'Acme workspace expansion', 'con_acme', 48000.00, 'USD', 'Proposal', 'usr_esraa'),
  ('deal_northstar_trial', 'Northstar enterprise trial', 'con_northstar', 24000.00, 'USD', 'Contacted', 'usr_john'),
  ('deal_greenfield_renewal', 'Greenfield annual renewal', 'con_greenfield', 72000.00, 'USD', 'Won', 'usr_abdallah');

INSERT INTO social_accounts (id, user_id, platform, account_name, webhook_url, access_token, status) VALUES
  ('soc_whatsapp', 'usr_esraa', 'whatsapp', 'Demo Company Support', 'http://localhost:3000/api/webhooks/whatsapp', 'dummy-whatsapp-token', 'connected'),
  ('soc_instagram', 'usr_sarah', 'instagram', '@democompany', 'http://localhost:3000/api/webhooks/instagram', 'dummy-instagram-token', 'connected'),
  ('soc_facebook', 'usr_abdallah', 'facebook', 'Demo Company', 'http://localhost:3000/api/webhooks/facebook', 'dummy-facebook-token', 'pending');

INSERT INTO mail_accounts (id, user_id, email_address, provider, oauth_token) VALUES
  ('mail_support', 'usr_sarah', 'support@democompany.com', 'google', 'dummy-google-oauth-token'),
  ('mail_sales', 'usr_esraa', 'sales@democompany.com', 'microsoft', 'dummy-microsoft-oauth-token');

INSERT INTO canvases (id, title, content, channel_id, creator_id) VALUES
  ('cnv_quarterly_plan', 'Q3 Planning Notes', 'Goals\n- Improve onboarding\n- Reduce support response time\n- Launch enterprise reporting\n\nOwners: Product, Support, and Operations.', 'chn_leadership', 'usr_abdallah'),
  ('cnv_product_feedback', 'Product Feedback Board', 'Customer themes from August:\n- Faster search\n- Better mobile navigation\n- More flexible notifications', 'chn_product', 'usr_omar'),
  ('cnv_standalone', 'Demo Workspace Guide', 'A standalone canvas for local development and demos.', NULL, 'usr_john');

INSERT INTO system_audit_logs (id, actor_id, action, details, ip_address, timestamp) VALUES
  ('log_workspace_created', 'usr_abdallah', 'workspace.created', 'Created the Demo Company workspace.', '127.0.0.1', '2026-08-01T08:45:00Z'),
  ('log_channel_created', 'usr_john', 'channel.created', 'Created #product for product planning.', '127.0.0.1', '2026-08-02T10:20:00Z'),
  ('log_deal_updated', 'usr_esraa', 'deal.stage_changed', 'Moved Acme workspace expansion to Proposal.', '127.0.0.1', '2026-08-04T13:10:00Z');

INSERT INTO file_assets (id, filename, file_size, mime_type, file_url, uploader_id, source_type, source_id) VALUES
  ('file_navigation_preview', 'navigation-preview.png', 248832, 'image/png', 'http://localhost:3000/uploads/navigation-preview.png', 'usr_john', 'channel', 'chn_product'),
  ('file_acme_summary', 'acme-escalation-summary.pdf', 184320, 'application/pdf', 'http://localhost:3000/uploads/acme-escalation-summary.pdf', 'usr_sarah', 'task', 'tsk_acme_handoff'),
  ('file_workspace_guide', 'workspace-guide.md', 4096, 'text/markdown', 'http://localhost:3000/uploads/workspace-guide.md', 'usr_abdallah', 'channel', 'chn_general');

INSERT INTO webhook_endpoints (id, name, url, event_types, secret_key, is_active) VALUES
  ('whk_crm_updates', 'CRM update notifications', 'http://localhost:3000/api/webhooks/crm', '["deal.created","deal.updated"]'::jsonb, 'local-demo-secret-crm', TRUE),
  ('whk_task_events', 'Task event notifications', 'http://localhost:3000/api/webhooks/tasks', '["task.created","task.completed"]'::jsonb, 'local-demo-secret-tasks', TRUE),
  ('whk_disabled_demo', 'Disabled demo endpoint', 'http://localhost:3000/api/webhooks/disabled', '["message.created"]'::jsonb, 'local-demo-secret-disabled', FALSE);

COMMIT;
