#!/usr/bin/env bash
# Detects hardcoded CJK strings in i18n-covered components.
# Run via: npm run lint:i18n

set -euo pipefail

FILES=(
  "components/hero-section.tsx"
  "components/header.tsx"
  "components/footer.tsx"
  "components/trending-section.tsx"
  "components/word-of-day.tsx"
  "components/daily-quote.tsx"
  "components/news-section.tsx"
  "components/stats-section.tsx"
)

cd "$(dirname "$0")/.."

FAILED=0
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP: $f (not found)"
    continue
  fi
  # Match JSX text content containing CJK characters (ignore inside {}, <>, comments, import paths)
  MATCHES=$(grep -nE '>[^<>{}]*[一-鿿][^<>{}]*<' "$f" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    echo "FAIL: hardcoded CJK in $f"
    echo "$MATCHES"
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo "Run 'npm run lint:i18n' to see all violations."
  exit 1
fi

echo "OK: no hardcoded CJK in i18n-covered files"
