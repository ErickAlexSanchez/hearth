CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS membership;
CREATE SCHEMA IF NOT EXISTS feed;
CREATE SCHEMA IF NOT EXISTS coach;

CREATE TABLE identity.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE identity.sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE membership.memberships (
  user_id uuid PRIMARY KEY REFERENCES identity.users (id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('free', 'member')),
  updated_at timestamptz NOT NULL
);

CREATE TABLE feed.posts (
  id uuid PRIMARY KEY,
  author_id uuid NOT NULL REFERENCES identity.users (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  visibility text NOT NULL CHECK (visibility IN ('public', 'members')),
  created_at timestamptz NOT NULL
);

CREATE INDEX feed_posts_created_at_id_idx ON feed.posts (created_at DESC, id DESC);

CREATE TABLE coach.messages (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'coach')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL
);

CREATE INDEX coach_messages_user_created_idx ON coach.messages (user_id, created_at);
CREATE INDEX coach_messages_created_at_idx ON coach.messages (created_at);
