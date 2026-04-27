-- Add topics column to daily_proverbs (unified 16-category taxonomy shared with corpus_texts)
ALTER TABLE public.daily_proverbs
    ADD COLUMN IF NOT EXISTS topics JSONB;

COMMENT ON COLUMN public.daily_proverbs.topics
    IS 'AI-labeled topic(s) using unified 16-class taxonomy: [{name, percentage}]';
