---V1__init_analytics_schema.sql: Analytics Database Schema

CREATE EXTENSION if NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS click_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    geo_country VARCHAR(100),
    geo_city VARCHAR(100),
    referrer TEXT,
    is_bot BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_click_analytics_short_code ON click_analytics(short_code);
CREATE INDEX IF NOT EXISTS idx_click_analytics_timestamp ON click_analytics(timestamp);