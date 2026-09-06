-- 1. Create Campaigns Table
CREATE TABLE  IF NOT EXISTS campaigns(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_users_id ON campaigns(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_user_name on campaigns(user_id, name);

-- 2. Enhance url_mappings with Campaigns FK, A/B Flag, and Smart Rules JSONB

ALTER TABLE url_mappings
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_ab_test BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN IF NOT EXISTS smart_rules JSONB;

CREATE INDEX IF NOT EXISTS idx_url_mappings_campaign_id ON url_mappings(campaign_id);

-- 3. Create A//B Tests Table
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_mapping_id UUID NOT NULL UNIQUE REFERENCES url_mappings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE', 'PAUSED', 'CONCLUDED'
    winning_variant VARCHAR(10), --Set when test is CONCLUDED (e.g 'B')
    cookie_ttl_seconds INT DEFAULT 2592000 NOT NULL, -- 30 days sticky cookie
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_url_mapping ON ab_tests(url_mapping_id);

-- 4. Create A/B Variants Table
CREATE TABLE IF NOT EXISTS ab_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ab_test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_key VARCHAR(10) NOT NULL,            -- 'A', 'B', 'C', 'D'
    destination_url TEXT NOT NULL,
    weight INT DEFAULT 50 NOT NULL,              -- Cumulative weight (sums to 100)
    is_control BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                                                         );

CREATE INDEX IF NOT EXISTS idx_ab_variants_test_id ON ab_variants(ab_test_id);