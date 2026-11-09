#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/assets/photos/previews dist/assets/audio
cp index.html _redirects robots.txt sitemap.xml dist/
cp site.webmanifest dist/ 2>/dev/null || true
cp assets/supernova.js assets/prismatic-burst.js assets/nebula-reference.jpg assets/Richard_Milo_Rowley_Resume.pdf assets/favicon.svg dist/assets/
cp assets/photos/*.webp dist/assets/photos/ 2>/dev/null || true
cp assets/photos/previews/* dist/assets/photos/previews/
cp assets/audio/* dist/assets/audio/ 2>/dev/null || true
node scripts/prerender.js
