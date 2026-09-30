ALTER TABLE sending_domains
    ALTER COLUMN verification_token DROP NOT NULL;

ALTER TABLE sending_domains
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS spf_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS spf_record TEXT,
    ADD COLUMN IF NOT EXISTS dkim_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS dkim_public_key TEXT,
    ADD COLUMN IF NOT EXISTS dmarc_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS dmarc_record TEXT,
    ADD COLUMN IF NOT EXISTS auth_checked_at TIMESTAMPTZ;