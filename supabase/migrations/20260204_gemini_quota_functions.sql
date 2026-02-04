-- Create function to increment Gemini quota
CREATE OR REPLACE FUNCTION increment_gemini_quota(p_license_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE licenses
    SET gemini_quota_used = gemini_quota_used + 1
    WHERE id = p_license_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset quotas daily (can be called by a cron job or manual trigger)
CREATE OR REPLACE FUNCTION reset_gemini_quotas()
RETURNS VOID AS $$
BEGIN
    UPDATE licenses
    SET gemini_quota_used = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
