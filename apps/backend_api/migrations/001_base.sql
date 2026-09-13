CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

CREATE TABLE orgs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TYPE user_role AS ENUM ('admin', 'member');

CREATE TABLE membership (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id INT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    PRIMARY KEY (user_id, org_id)
);

CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE list_members (
    id SERIAL PRIMARY KEY,
    list_id INT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
);

CREATE TABLE senders (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    reply_to TEXT,
    UNIQUE (org_id, email)
);

CREATE TABLE sending_domains (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    verification_token TEXT,
    verified_at TIMESTAMPTZ,
    UNIQUE (org_id, domain)
);

CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);