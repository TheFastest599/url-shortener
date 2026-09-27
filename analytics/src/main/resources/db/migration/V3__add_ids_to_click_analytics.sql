-- V3__add_ids_to_click_analytics.sql: Add url_id, campaign_id, and ab_test_id for multi-entity decoupled analytics
ALTER TABLE click_analytics
    ADD COLUMN IF NOT EXISTS url_id UUID DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS campaign_id UUID DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ab_test_id UUID DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_click_analytics_url_id ON click_analytics(url_id);
CREATE INDEX IF NOT EXISTS idx_click_analytics_campaign_id ON click_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_click_analytics_ab_test_id ON click_analytics(ab_test_id);
