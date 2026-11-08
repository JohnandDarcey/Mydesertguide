/** Apply curated page bodies after the data/SEO generator. Production heads and
 * integration scripts remain owned by the generator, never by a design preview.
 * Edit src/approved-pages for curated layout/content, and data.js for place data.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const root = new URL('../outputs/desert-insider/', import.meta.url);
const source = new URL('../src/approved-pages/', import.meta.url);
const base = 'https://mydesertguide.com';
async function files(dir) {
  const result=[];
  for(const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const file=new URL(entry.name+(entry.isDirectory()?'/':''),dir);
    if(entry.isDirectory())result.push(...await files(file));else result.push(file);
  }
  return result;
}
const shared = `<link rel="stylesheet" href="/brand.css?v=20261107-solcal">
<link rel="stylesheet" href="/guide-header.css?v=20261107-solcal">
<script src="/guide-header.js?v=20261107-solcal" defer></script>
<script src="/photo-credits.js?v=20261107-solcal" defer></script>`;
const homepage = await fs.readFile(new URL('index.html',root),'utf8');
const pixel = homepage.match(/<!-- begin Follow Up Boss Pixel -->[\s\S]*?<!-- end Follow Up Boss Pixel -->/)?.[0];
if(!pixel?.includes('<script'))throw new Error('Production Follow Up Boss Pixel missing');
for(const file of await files(source)) {
  const relative=path.relative(source.pathname,file.pathname);
  const target=new URL(relative,root);
  let body=await fs.readFile(file,'utf8');
  let original;
  if(relative==='events/index.html') {
    const url=`${base}/events/`;
    const title='Events Calendar | My Desert Guide';
    const description='Explore upcoming Coachella Valley events, browse the monthly calendar, and download a printable event guide with links to official details.';
    const breadcrumb={'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:base+'/'},{'@type':'ListItem',position:2,name:'Events',item:url}]};
    original=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow"><link rel="canonical" href="${url}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:image" content="${base}/assets/icons/icon-512.png"><meta property="og:image:alt" content="My Desert Guide"><meta name="twitter:image:alt" content="My Desert Guide"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${base}/assets/icons/icon-512.png"><meta name="theme-color" content="#0b6e76"><link rel="icon" href="/assets/icons/favicon-32.png"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="/directory.css?v=20261107-solcal"><link rel="stylesheet" href="/newsletter-signup.css?v=20261001-darcey-brand"><link rel="stylesheet" href="/events/events.css?v=20261107"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage','@id':url+'#webpage',url,name:title,description,isPartOf:{'@id':base+'/#website'},breadcrumb})}</script>${pixel}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org',...breadcrumb})}</script></head>`;
  }else original=await fs.readFile(target,'utf8');
  for(const tag of original.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)) {
    const src=tag[1].split('?')[0];
    if(/analytics|site-features|newsletter-signup|ask-darcey\.js|directory\.js/.test(src)&&!body.includes(src))body=body.replace('</body>',tag[0]+'\n</body>');
  }
  let head=original.slice(0,original.indexOf('</head>'));
  head=head.replace(/<link[^>]*href="[^\"]*(?:brand\.css|guide-header\.css|home-events\.css)[^\"]*"[^>]*>/g,'').replace(/<script[^>]*src="[^\"]*(?:guide-header\.js|photo-credits\.js)[^\"]*"[^>]*><\/script>/g,'');
  head=head.replace(/<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2[^\"]*"[^>]*>/g,'');
  head=head.replace(/(styles\.css|directory\.css)\?v=[^"']+/g,'$1?v=20261107-solcal-events');
  head=head.replace(/(<meta name="theme-color" content=")[^"]+/g,'$1#0b6e76');
  head=head.replace(/(?:[ \t]*\n){2,}/g,'\n').trimEnd();
  head+=`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;display=swap">${shared}`;
  if(relative==='index.html')head+='<link rel="stylesheet" href="/home-events.css?v=20261107">';
  await fs.mkdir(new URL('./',target),{recursive:true});
  await fs.writeFile(target,(head+'</head>\n'+body).replace(/[ \t]+$/gm,'').trimEnd()+'\n');
}
const sitemapFile=new URL('sitemap.xml',root);
let sitemap=await fs.readFile(sitemapFile,'utf8');
if(!sitemap.includes(`${base}/events/`))sitemap=sitemap.replace('</urlset>',`  <url><loc>${base}/events/</loc></url>\n</urlset>`);
await fs.writeFile(sitemapFile,sitemap);
console.log('Applied approved presentation with production SEO and integrations.');
