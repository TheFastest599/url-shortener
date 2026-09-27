-- Increase short_code column length to 64 characters to support branded vanity custom aliases
ALTER TABLE url_mappings ALTER COLUMN short_code TYPE VARCHAR(64);
