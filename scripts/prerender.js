/* Generate crawlable HTML for every public page from the one editable source. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const content = source.slice(source.indexOf('    const baseProjects = ['), source.indexOf('    const projects = baseProjects;'));
const groups = source.slice(source.indexOf('    const projectGroups = ['), source.indexOf('    function card(p)'));
const {baseProjects, projectGroups} = vm.runInNewContext(`${content}\n${groups}\n({baseProjects, projectGroups})`);
const bySlug = new Map(baseProjects.map(project => [project.slug, project]));
const site = 'https://supernovasunrise.space';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const descriptions = {
  projects:'Browse Milo Rowley’s digital tools, client websites, communication work, podcasts, writing, and live experiences.',
  about:'Meet Milo Rowley: a communicator, collaborator, musician, and creator whose work connects people and practical ideas.',
  resume:'Explore Milo Rowley’s experience in communication, quality assurance, community service, and digital tools.',
  contact:'Connect with Milo Rowley about communication, community projects, and creative collaborations.',
  now:'What Milo Rowley is doing now — service, study, podcasting, and the Mendure DME library system.'
};
const headings = {projects:'Projects',about:'About',resume:'Résumé',contact:'Connect',now:'Now'};
const cardDims = project => project.slug==='dme-library' ? ' width="4121" height="1031"' : project.slug==='scistrive' ? ' width="960" height="960"' : project.slug==='as-the-savior-would' ? ' width="800" height="800"' : ' width="1200" height="630"';
const cards = items => items.map(project => {
  const projHref = `/projects/${escape(encodeURIComponent(project.slug))}`;
  const img = project.preview
    ? `<a class="preview-link" href="${projHref}"><img src="${escape(project.preview.src)}" alt="${escape(project.preview.alt)}"${cardDims(project)} loading="lazy" decoding="async"></a>`
    : `<a class="preview-link" href="${projHref}"><span class="preview-glyph">${escape(project.glyph)}</span></a>`;
  const social = project.links && project.links.length ? project.links[0][1] : '';
  const badge = project.preview?.badge
    ? (social ? `<a class="preview-badge" href="${escape(social)}" target="_blank" rel="noopener noreferrer">${escape(project.preview.badge)} ↗</a>` : `<span class="preview-badge">${escape(project.preview.badge)}</span>`)
    : '';
  const art = project.preview
    ? `<div class="project-art has-image"><span class="project-preview">${img}${badge}</span></div>`
    : `<div class="project-art" style="--art-bg:${escape(project.colors[0])};--art-orb:${escape(project.colors[1])};--art-text:${escape(project.colors[2])}"><span class="project-preview">${img}${badge}</span></div>`;
  return `<article class="project-card">${art}<div class="card-body"><span class="tag">${escape(project.category)}</span><h3>${escape(project.title)}</h3><p>${escape(project.summary)}</p><a class="card-link" href="${projHref}">Explore project ↗</a></div></article>`;
}).join('');
const featured=['hands-of-the-lord','as-the-savior-would','dme-library','scistrive'].map(slug=>bySlug.get(slug));
const base=source.replace('<div class="project-grid" id="featured-grid"></div>',`<div class="project-grid" id="featured-grid">${cards(featured)}</div>`);

function render(page) {
  const project = page.project;
  const title = `${project?.title || headings[page.view]} — Milo Rowley`;
  const description = project ? `${project.summary} ${project.role}` : descriptions[page.view];
  const url = `${site}${page.url}`;
  let html = base.replace('<div class="view" id="home-view">','<div class="view" id="home-view" hidden>');
  html = html.replace(`id="${page.view}-view" hidden`,`id="${page.view}-view"`);
  html = html.replace(/<title>[^<]+<\/title>/,`<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${escape(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${escape(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${url}">`);
  if (page.view === 'projects') {
    const directory=projectGroups.map(group=>`<section class="project-group"><h3>${escape(group.title)}</h3><p>${escape(group.description)}</p><div class="project-grid">${cards(group.slugs.map(slug=>bySlug.get(slug)).filter(Boolean))}</div></section>`).join('');
    html=html.replace('<div id="all-projects"></div>',`<div id="all-projects">${directory}</div>`);
  }
  if(project) {
    html=html.replace('<span class="eyebrow" id="case-category"></span>',`<span class="eyebrow" id="case-category">${escape(project.category)}</span>`)
      .replace('<h1 id="case-title"></h1>',`<h1 id="case-title">${escape(project.title)}</h1>`)
      .replace('<p id="case-summary"></p>',`<p id="case-summary">${escape(project.summary)}</p>`)
      .replace('<p id="case-context"></p>',`<p id="case-context">${escape(project.context)}</p>`)
      .replace('<p id="case-role"></p>',`<p id="case-role">${escape(project.role)}</p>`)
      .replace('<p id="case-outcome"></p>',`<p id="case-outcome">${escape(project.outcome||'')}</p>`)
      .replace('<div class="case-metrics" id="case-metrics" role="list"></div>',`<div class="case-metrics" id="case-metrics" role="list">${(project.metrics||[]).map(([v,l])=>`<div class="metric" role="listitem"><b>${escape(v)}</b><span>${escape(l)}</span></div>`).join('')}</div>`)
      .replace('<div id="case-links"></div>',`<div id="case-links">${project.links.map(([label,link])=>`<a href="${escape(link)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`).join('')}</div>`);
    if(project.preview){
      html=html.replace('id="case-preview" hidden','id="case-preview"')
        .replace('<p id="case-preview-caption"></p>',`<p id="case-preview-caption">${escape(project.summary)}</p>`)
        .replace('<div id="case-preview-body"></div>',`<div id="case-preview-body"><figure><img src="${escape(project.preview.src)}" alt="${escape(project.preview.alt)}" loading="lazy" decoding="async"><figcaption>${escape(project.preview.alt)}</figcaption></figure></div>`);
    }
    if(project.slug==='dme-library') html=html.replace('id="dme-demo" aria-labelledby="demo-heading" hidden','id="dme-demo" aria-labelledby="demo-heading"');
    if(project.slug==='swimming-with-otters') html=html.replace('id="music-preview" hidden','id="music-preview"');
    if(project.slug==='family-history') html=html.replace('id="family-story" hidden','id="family-story"');
    if(['scistrive','dme-library','as-the-savior-would'].includes(project.slug)) html=html.replace('id="case-video" hidden','id="case-video"');
    if(project.slug==='as-the-savior-would') html=html.replace('id="podcast-preview" hidden','id="podcast-preview"');
    const ogImage = project.og ? `${site}${project.og}` : `${site}/assets/photos/violin-outdoors.webp`;
    const ogAlt = project.ogAlt || 'Milo playing violin outdoors';
    const ogW = project.slug==='as-the-savior-would' ? 800 : project.slug==='scistrive' ? 1200 : project.slug==='dme-library' ? 1920 : 1100;
    const ogH = project.slug==='as-the-savior-would' ? 800 : project.slug==='scistrive' ? 630 : project.slug==='dme-library' ? 480 : 825;
    html=html.replace(/<meta property="og:image" content="[^"]*">/,`<meta property="og:image" content="${ogImage}">`).replace(/<meta property="og:image:alt" content="[^"]*">/,`<meta property="og:image:alt" content="${escape(ogAlt)}">`).replace(/<meta property="og:image:width" content="[^"]*">/,`<meta property="og:image:width" content="${ogW}">`).replace(/<meta property="og:image:height" content="[^"]*">/,`<meta property="og:image:height" content="${ogH}">`);
  }
  return html;
}

fs.mkdirSync(path.join(dist,'pages'),{recursive:true});
fs.writeFileSync(path.join(dist,'index.html'),base);
const pages=[...Object.keys(headings).map(view=>({view,url:`/${view}`})),...baseProjects.map(project=>({view:'case',url:`/projects/${project.slug}`,project}))];
const redirects=pages.map((page,index)=>{
  const file=`pages/${index}.html`;
  fs.writeFileSync(path.join(dist,file),render(page));
  return `${page.url} /${file} 200`;
});
fs.writeFileSync(path.join(dist,'_redirects'),`${redirects.join('\n')}\n/* /index.html 200\n`);
console.log(`Prepared ${pages.length} crawlable pages and Netlify rewrites.`);
