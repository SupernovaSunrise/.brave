# Milo Rowley · Portfolio

A static portfolio with categorized project pages, a browser adaptation of the [Mendure DME database](https://github.com/SupernovaSunrise/Relational-Database), an About photo gallery, and a scroll-driven **supernova** — a star collapses, explodes into shockwave rings and 900 ejecta sparks, then cools into a nebula remnant that backs the whole site. Pointer gravity bends the sparks; click anywhere (outside links) for a flare. Toggle **Light / Dark** in the top nav to compare themes (respects your OS setting on first visit). Reduced-motion settings render a calm static frame.

**Live site:** https://supernovasunrise.netlify.app/

## View or edit

Use `python3 -m http.server 8000` from the repository root for local edits. Direct project URLs need Netlify's `_redirects` rule or a local server that serves `index.html` for unknown paths. The content and social links are in `index.html`; photos, the screenshot, and the résumé PDF are in `assets/`. The gallery photos are deliberately optimized WebP files. Project preview images live in `assets/photos/previews/` (real SciStrive screenshot, podcast cover art, DME dashboard, and branded SVG cards for Instagram-only pages).

## Setup: GitHub + Netlify secrets

Production deploys run through GitHub Actions (`.github/workflows/deploy-netlify.yml`), which builds the site with `scripts/build.sh` and publishes `dist/` to Netlify with the Netlify CLI. You need two secrets in GitHub. Never commit these values to git.

### 1. Find your Netlify Site ID (Project ID)

1. Go to [Netlify](https://app.netlify.com) and sign in.
2. Open the **supernovasunrise** site.
3. Go to **Site configuration → General**.
4. Under **Project details**, copy **Project ID** — it looks like `a1b2c3d4-e5f6-...` (a UUID). This is your `NETLIFY_SITE_ID`.

> If you don't have a Netlify site yet: **Add new site → Import an existing project → GitHub → pick this repo**. After the first import, turn off Netlify's own automatic builds so the GitHub Action is the only production deploy path:
> **Site configuration → Build & deploy → Builds → Build settings → "Automatically build repo" → OFF** (or set Build command / Publish directory to empty if prompted).

### 2. Create a Netlify personal access token

1. In Netlify, open your avatar menu (top-right) → **User settings**.
2. Go to **Applications → Personal access tokens → New access token**.
3. Give it a name like `portfolio-github-actions`, set an expiry (e.g. 6 months), and click **Create**.
4. Copy the token immediately — Netlify shows it only once. This is your `NETLIFY_AUTH_TOKEN`.

### 3. Add the secrets to GitHub

1. Open this repository on GitHub: `github.com/SupernovaSunrise/.brave`
2. Go to **Settings → Secrets and variables → Actions** (left sidebar).
3. Click **New repository secret** (top-right).
4. Create two secrets, one at a time:
   - **Name:** `NETLIFY_SITE_ID` — **Value:** the Project ID from step 1.
   - **Name:** `NETLIFY_AUTH_TOKEN` — **Value:** the token from step 2.
5. Click **Add secret** for each. Verify both appear under **Repository secrets** (values are hidden after saving — that's expected).

### 4. Verify

1. Go to the repo's **Actions** tab.
2. Either push a commit to `main` **or** click **Deploy portfolio to Netlify → Run workflow** (top-right) and choose branch `main`.
3. The run should show ✓ **Check Netlify credentials**, ✓ **Prepare static site**, and ✓ **Publish production deploy**.
4. Open https://supernovasunrise.netlify.app/ — the latest `main` should be live within ~2 minutes.

If the workflow fails on the credential check, the error message lists exactly which secret is missing. Most common fixes:

- **Secret name typo** — must be exactly `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (uppercase, underscores).
- **Site ID copied from the wrong place** — use the **Project ID** (UUID), not the site name or URL slug.
- **Token expired or revoked** — create a new one in step 2 and update the secret.
- **Actions disabled** — repo **Settings → Actions → General → Actions permissions** must allow all actions.

> **Security:** If a token ever leaks, revoke it in Netlify (**User settings → Applications**) and create a new one. GitHub secrets are encrypted and never appear in logs.

### Pull-request checks

`.github/workflows/build.yml` runs `scripts/build.sh` on every pull request to `main` — no secrets needed. It catches broken markup/prerender issues before merge. Branch protection (recommended): **Settings → Branches → Add branch protection rule** for `main`, require the **Build check** job, and require a PR before merging.

## Deploy notes

The site is plain HTML, CSS, and JavaScript. `netlify.toml` runs `bash scripts/build.sh` and publishes `dist`; the build includes a sitemap, robots file, and HTML snapshots with page specific metadata for each project URL. `scripts/prerender.js` derives those snapshots from the project data in `index.html`. This keeps uploaded source photos and working drafts out of the published directory.

Social accounts use direct links plus native previews: SciStrive has a live screenshot and iframe (with a hard link fallback if embedding is blocked), Spotify/YouTube/Apple use their cover art and embeds, and Instagram/Facebook pages link out with branded preview cards (Instagram blocks reliable scraping/embedding of arbitrary profiles, so the cards are intentional artwork, not scraped photos). All preview images live in `assets/photos/previews/` and are copied to `dist/assets/photos/previews/` by the build.

## Domains: best-practice recommendation

You like the playful alternatives (`.brave`, `.space`, `.live`) and both `supernovasunrise.com` and `milorowley.com` are available. Best practice for a personal portfolio:

**Buy both `.com`s + one playful TLD + an `.eth` name.**

1. **Primary site:** `milorowley.com` — professional, memorable, best for resumes/LinkedIn. Point Netlify here as the canonical domain.
2. **Brand alias:** `supernovasunrise.com` — forward/redirect to `milorowley.com` (Netlify: Domain management → add both → set primary + redirect).
3. **Fun pointer:** pick **one** of `.space` / `.live` / `.brave` (`.space` reads most like a portfolio; `.live` is punchy; `.brave` is niche). Redirect it to the primary too — it's a conversation starter on business cards, not your SEO home. Don't dilute SEO across multiple canonicals.
4. **Web3 identity (optional):** `supernovasunrise.eth` on ENS (~$5/yr) for wallet/QR/Twitter. Not a website host — it's your onchain handle. You can point it to the same site via IPFS later.

Why not web3-only? `.crypto`/`.x` domains have weaker email deliverability, lower recruiter click-through, and need extra DNS work. The `.com` + `.eth` combo gives you both worlds: trust + edge.

**How to wire it on Netlify:** Netlify → your site → **Domain management → Add a domain** for each (CNAME / A records are auto-verified for registrar DNS, or use Netlify DNS). Set one as primary; add the others as **redirect aliases**. HTTPS is automatic (Let's Encrypt). After switching, update `site` in `scripts/prerender.js`, `robots.txt`, `sitemap.xml`, and canonical/OG URLs in `index.html` to the new domain, then rebuild.
