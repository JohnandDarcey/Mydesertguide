import { TIME_ZONE, dayKey, fromDay, monthOf, matchesFilters, validateEvent } from './events/events-core.mjs';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = key => fromDay(key).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric'});
export function monthEvents(events, today=dayKey()) {
  const month=monthOf(today);
  return events.filter(validateEvent).filter(event=>matchesFilters(event,{today,month,range:'month'})).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title));
}
export function monthHighlights(events, today=dayKey(), limit=12) {
  const seen=new Set();
  return monthEvents(events,today).filter(event=>{
    const key=`${event.title.trim().toLowerCase()}|${event.venue.trim().toLowerCase()}`;
    if(seen.has(key))return false;seen.add(key);return true;
  }).slice(0,limit);
}
export function monthCard(event) {
  const dates=label(event.startDate)+(event.endDate&&event.endDate!==event.startDate?` – ${label(event.endDate)}`:'');
  return `<article class="home-event-card"><p class="home-event-date">${escape(dates)} <span>${escape(event.category)}</span></p><h3><a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">${escape(event.title)} <span aria-hidden="true">↗</span></a></h3><p class="home-event-place">${escape(event.venue)} · ${escape(event.city)}</p><p class="home-event-time">${escape(event.timeLabel||'See source for times')}</p><p class="home-event-source">Source: <a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">${escape(event.sourceName)}</a></p></article>`;
}
export function monthSection() {
  return `<section class="section home-month-events" id="whats-happening" aria-labelledby="home-events-title"><div class="home-events-heading"><div><p class="eyebrow">Out &amp; about in the Coachella Valley</p><h2 id="home-events-title">What's happening<br><span>this month.</span></h2><p>Local events, good times, and a reason to get out.</p></div><span class="home-events-month" id="home-events-month"></span></div><div class="home-events-grid" id="home-events-list" aria-live="polite"><p>Loading this month's events…</p></div><div class="home-events-bottom"><p id="home-events-note">A selection of local events. Check the source for tickets and updates.</p><a class="home-events-more" href="/events/?range=month&amp;source=all&amp;view=list#calendar">More this month <span aria-hidden="true">→</span></a></div></section>`;
}
export function mountMonthEvents() {
  const section=document.querySelector('#whats-happening');if(!section)return;
  const list=section.querySelector('#home-events-list');const note=section.querySelector('#home-events-note');
  let busy=false;
  async function refresh() {
    if(busy)return;busy=true;
    const today=dayKey();const month=monthOf(today);
    section.querySelector('#home-events-month').textContent=fromDay(month+'-01').toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'});
    try {
      const response=await fetch('/events/events-data.json',{cache:'no-store'});if(!response.ok)throw new Error('Events unavailable');
      const data=await response.json();if(data.timezone!==TIME_ZONE||!Array.isArray(data.events))throw new Error('Invalid events');
      const highlights=monthHighlights(data.events,today);
      const monthCount=monthEvents(data.events,today).length;
      section.querySelector('.home-events-more').innerHTML=monthCount?`See all ${monthCount} this month <span aria-hidden="true">→</span>`:'More this month <span aria-hidden="true">→</span>';
      list.innerHTML=highlights.length?highlights.map(monthCard).join(''):'<p class="home-events-empty">More plans are on the way. Check the full events page for upcoming dates.</p>';
      const stale=data.lastChecked&&(+fromDay(today)-+fromDay(data.lastChecked))/86400000>7;
      note.textContent=`A selection of local events, not a complete calendar.${data.sync?.enabled?' Daily event checks are scheduled.':''}${data.lastChecked?' Last checked '+label(data.lastChecked)+'.':''} ${stale?'Listings may be out of date. ':''}Check the source before making plans.`;
    }catch{
      list.innerHTML='<p class="home-events-empty">This month’s events are temporarily unavailable. Try the full events page below.</p>';
      note.textContent='Check the source for tickets, times and updates.';
    }finally{busy=false;}
  }
  void refresh();
  setInterval(()=>{if(!document.hidden)void refresh();},30*60*1000);
  const resume=()=>{if(!document.hidden)void refresh();};
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('pageshow',event=>{if(event.persisted)void refresh();});
}
