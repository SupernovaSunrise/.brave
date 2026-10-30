# Milo Rowley · Portfolio

A static portfolio with project pages, a browser adaptation of the [Mendure DME database](https://github.com/SupernovaSunrise/Relational-Database), social previews, and a scroll driven sunrise with a persistent WebGL supernova. Browsers without WebGL use the CSS nebula treatment.

## View or edit

Open `index.html` in a browser, or use a local static server such as `python3 -m http.server 8000`. The content, project descriptions, and social links are in `index.html`; images and the résumé PDF are in `assets/`.

## Netlify deployment through GitHub Actions

1. Create a Netlify project for this site. If you import this repository in Netlify, turn off its own automatic builds after the first import so the GitHub Action is the only production deploy path.
2. Find **Project ID** in Netlify's **Project configuration → General → Project details**.
3. Generate a Netlify personal access token in **User settings → Applications → Personal access tokens**.
4. In this GitHub repository, add **Actions secrets** `NETLIFY_SITE_ID` (the Project ID) and `NETLIFY_AUTH_TOKEN` (the access token). Never commit the token.
5. Push to `main`, or run **Deploy portfolio to Netlify** under GitHub Actions. The workflow publishes only `index.html` and the assets directory. It fails with a clear message until both secrets are configured.

The site is plain HTML, CSS, and JavaScript, so no build command is required. `netlify.toml` also declares the root publish directory for manual Netlify imports; the Action publishes its curated `dist` folder.

Some previews rely on third-party embeds. SciStrive may block frames, and Instagram/Spotify may require a browser session; the project and channel links stay available.
