#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/assets/photos
cp index.html _redirects robots.txt sitemap.xml dist/
cp assets/prismatic-burst.js assets/nebula-reference.jpg assets/Richard_Milo_Rowley_Resume.pdf assets/favicon.svg dist/assets/
cp assets/photos/* dist/assets/photos/
node scripts/prerender.js
