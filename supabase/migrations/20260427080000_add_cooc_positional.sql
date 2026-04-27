-- 位置型共現詞表：依關鍵詞左/右相對位置分類（Word Sketch 用）
CREATE TABLE IF NOT EXISTS public.cooc_positional (
    id        BIGSERIAL PRIMARY KEY,
    word      TEXT NOT NULL,
    partner   TEXT NOT NULL,
    category  TEXT NOT NULL,
    count     INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT uq_cooc_pos UNIQUE (word, partner, category)
);

COMMENT ON TABLE public.cooc_positional IS
    'Position-based collocates for Word Sketch: N_Modifier/Modifies/Object_of/Subject_of/Possession';

CREATE INDEX IF NOT EXISTS idx_cooc_pos_word ON public.cooc_positional (word);
