-- Increase short_code column length to 64 characters to support branded vanity custom aliases in analytics
ALTER TABLE click_analytics ALTER COLUMN short_code TYPE VARCHAR(64);
