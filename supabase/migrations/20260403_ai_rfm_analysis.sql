-- =============================================
-- AI RFM ANALYSIS (CUSTOMER SEGMENTATION)
-- =============================================

CREATE OR REPLACE FUNCTION get_customer_rfm_analysis(target_tenant_id UUID)
RETURNS TABLE (
    customer_id UUID,
    unvani VARCHAR,
    recency INT,
    frequency INT,
    monetary DECIMAL,
    segment VARCHAR,
    color VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH customer_stats AS (
        SELECT 
            c.id as cid,
            c.unvani as name,
            EXTRACT(DAY FROM (NOW() - MAX(s.created_at)))::INT as rec,
            COUNT(s.id)::INT as freq,
            SUM(s.total_amount)::DECIMAL as mon
        FROM cari_hesaplar c
        LEFT JOIN sales s ON s.customer_id = c.id
        WHERE c.tenant_id = target_tenant_id AND c.status = 'active'
        GROUP BY c.id, c.unvani
    )
    SELECT 
        cid,
        name,
        COALESCE(rec, 999), 
        freq, 
        COALESCE(mon, 0),
        CASE 
            WHEN freq >= 10 AND mon >= 5000 AND rec <= 30 THEN 'VIP'
            WHEN freq >= 5 AND rec <= 60 THEN 'Sadık Müşteri'
            WHEN rec > 90 AND freq > 0 THEN 'Riskli (Kaybedilmek Üzere)'
            WHEN freq = 1 AND rec <= 30 THEN 'Yeni Müşteri'
            WHEN freq = 0 THEN 'Potansiyel'
            ELSE 'Standart'
        END as seg,
        CASE 
            WHEN freq >= 10 AND mon >= 5000 AND rec <= 30 THEN '#8b5cf6' -- Violet
            WHEN freq >= 5 AND rec <= 60 THEN '#10b981' -- Emerald
            WHEN rec > 90 AND freq > 0 THEN '#ef4444' -- Red
            WHEN freq = 1 AND rec <= 30 THEN '#3b82f6' -- Blue
            WHEN freq = 0 THEN '#6b7280' -- Gray
            ELSE '#94a3b8' -- Slate
        END as col
    FROM customer_stats;
END;
$$ LANGUAGE plpgsql;
