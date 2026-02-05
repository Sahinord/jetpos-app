-- Add OpenRouter API Key to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT;
