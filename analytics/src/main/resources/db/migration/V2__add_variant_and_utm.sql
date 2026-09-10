-- V2__add_variant_and_utm.sql: Add A/B Variant and Inbound UTM Tracking
ALTER TABLE click_analytics
    ADD COLUMN IF NOT EXISTS variant VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_click_analytics_short_code_variant ON click_analytics(short_code, variant);
CREATE INDEX IF NOT EXISTS idx_click_analytics_utm_campaign ON click_analytics(short_code, utm_campaign);
CREATE INDEX IF NOT EXISTS idx_click_analytics_utm_source ON click_analytics(short_code, utm_source);
