-- Hakka Corpus Database Schema
-- Run against: postgresql://postgres:postgres@localhost:54322/postgres

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ──────────────────────────────────────────────
-- 1. hakka_dict: Main dictionary entries
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hakka_dict (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    heteronyms  JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_json    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hakka_dict_title
    ON hakka_dict (title);
CREATE INDEX IF NOT EXISTS idx_hakka_dict_title_trgm
    ON hakka_dict USING gin (title gin_trgm_ops);

-- ──────────────────────────────────────────────
-- 2. pinyin_index: Searchable pinyin for each heteronym
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pinyin_index (
    id          SERIAL PRIMARY KEY,
    dict_id     INTEGER NOT NULL REFERENCES hakka_dict(id) ON DELETE CASCADE,
    word        TEXT NOT NULL,
    pinyin_full TEXT NOT NULL,
    pinyin_base TEXT NOT NULL,
    dialect     TEXT NOT NULL,
    definition  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pinyin_index_word
    ON pinyin_index (word);
CREATE INDEX IF NOT EXISTS idx_pinyin_index_pinyin_base
    ON pinyin_index (pinyin_base);
CREATE INDEX IF NOT EXISTS idx_pinyin_index_dict_id
    ON pinyin_index (dict_id);
CREATE INDEX IF NOT EXISTS idx_pinyin_index_dialect
    ON pinyin_index (dialect);
CREATE INDEX IF NOT EXISTS idx_pinyin_index_pinyin_base_trgm
    ON pinyin_index USING gin (pinyin_base gin_trgm_ops);

-- ──────────────────────────────────────────────
-- 3. cooccurrence: Word co-occurrence statistics
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cooccurrence (
    id          SERIAL PRIMARY KEY,
    word        TEXT NOT NULL,
    partner     TEXT NOT NULL,
    co_count    INTEGER NOT NULL DEFAULT 0,
    word_freq   INTEGER NOT NULL DEFAULT 0,
    logdice     NUMERIC(8, 4) NOT NULL DEFAULT 0,
    mi_score    NUMERIC(10, 4) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cooc_word_partner UNIQUE (word, partner)
);

CREATE INDEX IF NOT EXISTS idx_cooc_word
    ON cooccurrence (word);
CREATE INDEX IF NOT EXISTS idx_cooc_word_trgm
    ON cooccurrence USING gin (word gin_trgm_ops);

-- ──────────────────────────────────────────────
-- 4. query_log: Search query analytics
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS query_log (
    id           SERIAL PRIMARY KEY,
    query_text   TEXT NOT NULL,
    query_type   TEXT NOT NULL,
    dialect      TEXT,
    result_count INTEGER DEFAULT 0,
    response_ms  INTEGER DEFAULT 0,
    ip_hash      TEXT,
    session_id   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_log_session_id
    ON query_log (session_id);
CREATE INDEX IF NOT EXISTS idx_query_log_created_at
    ON query_log (created_at);

-- ──────────────────────────────────────────────
-- 5. chat_history: AI chat conversations
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    mode        TEXT,
    metadata    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session_id
    ON chat_history (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at
    ON chat_history (created_at);

-- ──────────────────────────────────────────────
-- 6. daily_proverbs: 諺語/歇後語/佳句（正規化）
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_proverbs (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    pinyin      TEXT,
    dialect     TEXT,
    definition  TEXT,
    example     TEXT,
    category    TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_proverbs_active
    ON daily_proverbs (is_active);
CREATE INDEX IF NOT EXISTS idx_daily_proverbs_category
    ON daily_proverbs (category);
CREATE INDEX IF NOT EXISTS idx_daily_proverbs_dialect
    ON daily_proverbs (dialect);

-- ──────────────────────────────────────────────
-- 7. users: Authentication
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    display_name  TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_username
    ON users (username);

-- ──────────────────────────────────────────────
-- 8. speakers: Oral corpus informants
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS speakers (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    dialect        TEXT NOT NULL,
    region         TEXT,
    birth_year     SMALLINT,
    title          TEXT,
    bio            TEXT,
    portrait_url   TEXT NOT NULL DEFAULT '',
    audio_url      TEXT NOT NULL DEFAULT '',
    audio_duration INTEGER NOT NULL DEFAULT 0,
    has_video      BOOLEAN NOT NULL DEFAULT false,
    sort_order     SMALLINT NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_speakers_dialect
    ON speakers (dialect);
CREATE INDEX IF NOT EXISTS idx_speakers_sort
    ON speakers (sort_order, id);
