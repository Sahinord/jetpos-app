-- Add Gemini API Key to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS gemini_quota_used INTEGER DEFAULT 0;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS gemini_quota_limit INTEGER DEFAULT 1500; -- Free tier: 1500/day

-- Add comment
COMMENT ON COLUMN licenses.gemini_api_key IS 'Gemini AI API key for invoice analysis (admin-managed)';
COMMENT ON COLUMN licenses.gemini_quota_used IS 'Number of AI requests used today';
COMMENT ON COLUMN licenses.gemini_quota_limit IS 'Daily quota limit for AI requests';
