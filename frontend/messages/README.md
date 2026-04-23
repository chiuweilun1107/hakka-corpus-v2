# Translation Messages — Taiwan Hakka Corpus v2

## Overview

This directory contains the UI string translations for 4 locales:

| File | Locale | Status |
|------|--------|--------|
| `zh-TW.json` | Traditional Chinese | ✅ Source of truth |
| `en.json` | English | ✅ Professional review done |
| `hak-sixian.json` | Hakka Sixian (四縣腔) | ⚠️ Demo draft — pending linguist review |
| `hak-hailu.json` | Hakka Hailu (海陸腔) | ⚠️ Demo draft — pending linguist review |

> **Hakka Translation Disclaimer**: The Hakka (hak-sixian and hak-hailu) translations are a
> demonstration draft authored with reference to the Ministry of Education Taiwan Hakka Dictionary
> (https://hakkadict.moe.edu.tw/). Key UI terms include romanized tonal notation per the MOE
> standard. **Professional linguist review must be commissioned before public launch.**

## Fallback Behavior

If a key is missing from a locale file, the system falls back to `zh-TW` automatically.
You do **not** need to translate every key in Hakka files — untranslated keys will show Chinese.

## Key Naming Convention

Keys are flat, dot-joined, and semantic. Never name a key after its position (`button1`, `label3`).

```
namespace.component.elementOrAction
```

| Namespace | Scope |
|-----------|-------|
| `seo.*` | Page `<title>`, meta description, keywords |
| `nav.login`, `nav.skipToContent` | Header top-level actions |
| `nav.categories.<slug>.label` | Navigation category names |
| `nav.categories.<slug>.children.<slug>` | Navigation sub-item names |
| `hero.*` | Homepage hero section |
| `hero.searchForm.*` | Search form within hero |
| `hero.popularSearch.*` | Trending suggestions |
| `cultureHub.*` | Culture Hub section |
| `speaker.*` | Speaker Profiles section |
| `trending.*` | Trending Queries section |
| `wordOfDay.*` | Word of the Day panel |
| `dailyQuote.*` | Daily Quote panel |
| `dialectPanel.*` | Dialect Explorer panel |
| `stats.*` | Statistics section |
| `news.*` | News section |
| `footer.*` | Footer |
| `theme.*` | Theme / style toggle |
| `language.*` | Language switcher |
| `common.*` | Shared UI (loading, error, retry) |

## ICU Message Format

For dynamic values, use ICU syntax:

```json
"trending": {
  "count": "{n} 筆",
  "resultCount": "{count, plural, =0 {沒有結果} one {# 筆} other {# 筆}}"
}
```

Usage in code:
```tsx
const t = useTranslations('trending')
t('count', { n: 42 })          // "42 筆"
t('resultCount', { count: 0 }) // "沒有結果"
```

## Adding a New Key

1. Add to `zh-TW.json` first (source of truth)
2. Add to `en.json` with professional English
3. `hak-sixian.json` and `hak-hailu.json`: add only if you have a verified Hakka translation;
   otherwise omit — zh-TW fallback will be used automatically
4. In your component: `const t = useTranslations('namespace')` then `t('yourKey')`

TypeScript will error at compile time if you reference a key that does not exist in `zh-TW.json`.

## Handoff Workflow

When ready for professional translation:

1. Export the JSON files
2. Import into a TMS (Crowdin, Lokalise, or Weblate) — all are compatible with flat JSON
3. Translators complete Hakka columns
4. Export translated JSON → replace files in this directory → open PR

## Running Checks

```bash
# Detect hardcoded Chinese in i18n-covered components
npm run lint:i18n

# TypeScript will error on missing translation keys
npm run build
```
