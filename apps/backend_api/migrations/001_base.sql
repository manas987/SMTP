CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE
);

CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE list_members (
    id SERIAL PRIMARY KEY,
    list_id INT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    UNIQUE (list_id, email)
);

CREATE TABLE pending_sender_mails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    verification_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, email)
);

CREATE TABLE sending_domains (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    dkim_selector TEXT,
    dkim_private_key TEXT,
    UNIQUE (user_id, domain)
);

CREATE TABLE senders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE
);