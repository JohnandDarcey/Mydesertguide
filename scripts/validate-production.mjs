import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateEvent, matchesFilters, shiftMonth, monthDays, dayKey} from '../outputs/desert-insider/events/events-core.mjs';
import {monthHighlights, monthEvents} from '../outputs/desert-insider/home-events.mjs';
import {createMonthPDF} from '../outputs/desert-insider/events/events-pdf.mjs';
const root='outputs/desert-insider/';
const invariants=JSON.parse(await fs.readFile('scripts/production-invariants.json','utf8'));
for(const [file,hash] of Object.entries(invariants.integrationHashes))assert.equal(createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,`Production integration changed: ${file}`);
const pages=[...invariants.originalPages,root+'events/index.html',root+'place/the-show-at-agua-caliente/index.html'];
for(const file of pages){
 const html=await fs.readFile(file,'utf8');
 if(file.includes('/admin/'))continue;
 assert(!/preview-safety|brand-preview-notice|private preview|design preview|form-action 'none'/i.test(html),`Preview restriction: ${file}`);
 if(!file.includes('/saved/'))assert(!/<meta[^>]+name="robots"[^>]+noindex/i.test(html),`Noindex: ${file}`);
 const route=file.slice(root.length).replace(/index\.html$/,'');
 assert(html.includes(`rel="canonical" href="https://mydesertguide.com/${route}"`),`Canonical missing: ${file}`);
 assert.equal(html.split('WT-WCOHTMTK').length-1,1,`FUB Pixel missing or duplicated: ${file}`);
 assert(html.includes('analytics-config.js')&&html.includes('analytics.js'),`Analytics missing: ${file}`);
 assert(html.includes('newsletter-signup.js'),`Newsletter missing: ${file}`);
 assert(html.includes('/brand.css')&&html.includes('/guide-header.css'),`Approved styling missing: ${file}`);
 for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
  const schema=JSON.parse(match[1]); assert(!/"(?:@id|url|item)":"\//.test(JSON.stringify(schema)),`Relative structured data: ${file}`);
 }
 if(file!==root+'index.html')assert(html.includes('href="/events/"'),`Events navigation missing: ${file}`);
}
const lead=await fs.readFile(root+'ask-darcey/index.html','utf8');
assert(lead.includes('name="consent"')&&lead.includes('/ask-darcey.js'));
assert(!/<button[^>]+type="submit"[^>]+disabled/.test(lead));
for(const forbidden of ['preview-safety.js','snapshot-manifest.json','events/maintenance.json','events/source-registry.json'])await assert.rejects(fs.access(root+forbidden),`Private file shipped: ${forbidden}`);
for(const file of ['events/index.html','events/events.js','events/events-pdf.mjs'])assert(!/preview/i.test(await fs.readFile(root+file,'utf8')),`Preview copy: ${file}`);
const events=JSON.parse(await fs.readFile(root+'events/events-data.json','utf8'));
assert.equal(events.timezone,'America/Los_Angeles');assert(events.events.length>0);
assert(events.events.every(validateEvent),'Invalid event snapshot');
assert(!/sourceChecks|automationId|writerToken|apiKey/.test(JSON.stringify(events)),'Private event metadata leaked');
assert.equal(dayKey(new Date('2026-11-08T07:59:00Z')),'2026-11-07');
assert.equal(shiftMonth('2026-12',1),'2027-01');assert.equal(monthDays('2026-11').length,42);
const fixture={id:'1',title:'Test',city:'Palm Springs',venue:'Venue',sourceName:'Official',checkedAt:'2026-11-07',startDate:'2026-11-08',url:'https://example.com/'};
assert(!validateEvent({...fixture,url:'javascript:alert(1)'}));
assert(!matchesFilters({...fixture,status:'cancelled'},{today:'2026-11-07'}));
assert(!matchesFilters({...fixture,startDate:'2026-11-06'},{today:'2026-11-07'}));
assert.equal(monthEvents([fixture],'2026-11-07').length,1);
assert.equal(monthHighlights([fixture,{...fixture,id:'2'}],'2026-11-07').length,1);
const pdf=createMonthPDF('2026-11',events.events,'2026-11-07');
assert(pdf instanceof Uint8Array);assert(new TextDecoder().decode(pdf).startsWith('%PDF-'));assert(!new TextDecoder().decode(pdf).includes('PRIVATE PREVIEW'));
const sw=await fs.readFile(root+'sw.js','utf8');assert(sw.includes('url.pathname === "/events/events-data.json"'));
console.log(`Preserved ${invariants.originalPages.length} old pages and ${Object.keys(invariants.integrationHashes).length} unchanged integrations; verified production metadata, active forms, ${events.events.length} public events and PDF generation.`);
