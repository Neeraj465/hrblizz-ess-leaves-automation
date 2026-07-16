#!/usr/bin/env bash
#
# One-shot setup: installs dependencies, Playwright browsers, and creates .env.
# After this, fill in the credentials in .env and run `npm test`.
#
set -e

cd "$(dirname "$0")/.."

echo "1/3  Installing dependencies..."
npm install

echo "2/3  Installing Playwright browsers..."
npx playwright install chromium

echo "3/3  Setting up .env..."
if [ -f .env ]; then
  echo "     .env already exists — leaving it as is."
else
  cp .env.example .env
  echo "     Created .env — fill in the real credentials before running tests."
fi

echo "Done. Run the tests with: npm test"
