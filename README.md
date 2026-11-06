# Milo Rowley · Portfolio

A static portfolio with categorized project pages, a browser adaptation of the [Mendure DME database](https://github.com/SupernovaSunrise/Relational-Database), an About photo gallery, and a scroll driven sunrise with a persistent WebGL supernova. Move the pointer to see the beams respond, or click an open area to send out a wave of light. Browsers without WebGL use the CSS nebula treatment; reduced motion settings pause the shader animation.

## View or edit

Use `python3 -m http.server 8000` from the repository root for local edits. Direct project URLs need Netlify's `_redirects` rule or a local server that serves `index.html` for unknown paths. The content and social links are in `index.html`; photos, the screenshot, and the résumé PDF are in `assets/`. The gallery photos are deliberately optimized WebP files.

## Netlify deployment through GitHub Actions

1. Create a Netlify project for this site. If you import this repository in Netlify, turn off its own automatic builds after the first import so the GitHub Action is the only production deploy path.
2. Find **Project ID** in Netlify's **Project configuration → General → Project details**.
3. Generate a Netlify personal access token in **User settings → Applications → Personal access tokens**.
4. In this GitHub repository, add **Actions secrets** `NETLIFY_SITE_ID` (the Project ID) and `NETLIFY_AUTH_TOKEN` (the access token). Never commit the token.
5. Push to `main`, or run **Deploy portfolio to Netlify** under GitHub Actions. The workflow runs `scripts/build.sh` and publishes the curated `dist` directory. It fails with a clear message until both secrets are configured.

The site is plain HTML, CSS, and JavaScript. `netlify.toml` runs `bash scripts/build.sh` and publishes `dist`; the build includes a sitemap, robots file, and HTML snapshots with page specific metadata for each project URL. `scripts/prerender.js` derives those snapshots from the project data in `index.html`. This keeps uploaded source photos and working drafts out of the published directory.

Social accounts use direct links instead of external embeds. SciStrive may block its optional iframe; the project still links directly to the site.
