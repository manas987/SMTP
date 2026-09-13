CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE
);

CREATE TABLE orgs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TYPE user_role AS ENUM ('admin', 'member');


CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE list_members (
    id SERIAL PRIMARY KEY,
    list_id INT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    UNIQUE (list_id, email)
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

