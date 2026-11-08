import { TIME_ZONE, dayKey, fromDay, shiftDay, validateEvent } from './events/events-core.mjs';

export const HOME_EVENT_LIMIT = 3;
export const REFRESH_INTERVAL = 30 * 60 * 1000;
export const DATE_CHECK_INTERVAL = 60 * 1000;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDay = key => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(+fromDay(key)) && fromDay(key).toISOString().slice(0,10) === key;
const label = key => fromDay(key).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric'});
const endOf = event => event.endDate || event.startDate;
const firstVisibleDay = (event, today) => event.startDate < today ? today : event.startDate;

// Calendar days in the valley, not the visitor's timezone or a fixed 72 hours.
export function upcomingEvents(events, today=dayKey()) {
  const through = shiftDay(today, 2);
  return events.filter(event => event && typeof event === 'object' && validateEvent(event) &&
    typeof event.title === 'string' && typeof event.venue === 'string' &&
    validDay(endOf(event)) && !['cancelled','postponed'].includes(event.status) &&
    event.startDate <= through && endOf(event) >= today)
    .sort((a,b) => firstVisibleDay(a,today).localeCompare(firstVisibleDay(b,today)) ||
      endOf(a).localeCompare(endOf(b)) || a.title.localeCompare(b.title));
}
export function upcomingHighlights(events, today=dayKey(), limit=HOME_EVENT_LIMIT) {
  const seen=new Set();
  return upcomingEvents(events,today).filter(event => {
    const key=`${event.title.trim().replace(/\s+/g,' ').toLowerCase()}|${event.venue.trim().replace(/\s+/g,' ').toLowerCase()}`;
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).slice(0,Math.min(HOME_EVENT_LIMIT,Math.max(0,limit)));
}
export function eventCard(event) {
  const dates=label(event.startDate)+(event.endDate&&event.endDate!==event.startDate?` – ${label(event.endDate)}`:'');
  return `<article class="home-event-card"><p class="home-event-date">${escape(dates)} <span>${escape(event.category)}</span></p><h3><a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">${escape(event.title)} <span aria-hidden="true">↗</span></a></h3><p class="home-event-place">${escape(event.venue)} · ${escape(event.city)}</p><p class="home-event-time">${escape(event.timeLabel||'See source for times')}</p><p class="home-event-source">Source: <a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">${escape(event.sourceName)}</a></p></article>`;
}
export function upcomingSection() {
  return `<section class="section home-month-events" id="whats-happening" aria-labelledby="home-events-title"><div class="home-events-heading"><div><p class="eyebrow">Out &amp; about in the Coachella Valley</p><h2 id="home-events-title">What's happening<br><span>the next few days.</span></h2><p>A few ideas for today and the next two days. Explore the calendar for more.</p></div><span class="home-events-month" id="home-events-month"></span></div><div class="home-events-grid" id="home-events-list" aria-live="polite"><p>Loading upcoming events…</p></div><div class="home-events-bottom"><p id="home-events-note">A few local highlights. Check the source for tickets and updates.</p><a class="home-events-more" href="/events/?source=all#calendar">View full calendar <span aria-hidden="true">→</span></a></div></section>`;
}

export function mountUpcomingEvents({document=globalThis.document,window=globalThis.window,fetch=globalThis.fetch,now=()=>new Date()}={}) {
  const section=document.querySelector('#whats-happening');if(!section)return;
  const list=section.querySelector('#home-events-list');
  const note=section.querySelector('#home-events-note');
  const badge=section.querySelector('#home-events-month');
  let snapshot=null, busy=false, failed=false, disposed=false, displayedDay=null, controller=null, lastRenderedHtml=null;
  function render() {
    const today=dayKey(now());displayedDay=today;
    badge.textContent=`${label(today)} – ${label(shiftDay(today,2))} · Pacific time`;
    const highlights=snapshot?upcomingHighlights(snapshot.events,today):[];
    const html=highlights.length?highlights.map(eventCard).join(''):
      `<p class="home-events-empty">${failed&&!snapshot?'Upcoming events are temporarily unavailable. Try the full calendar below.':snapshot?'No listed events for the next few days. Explore the full calendar for more dates.':'Loading upcoming events…'}</p>`;
    // Avoid resetting keyboard focus and announcing identical cards on refresh.
    if(lastRenderedHtml!==html){list.innerHTML=html;lastRenderedHtml=html;}
    const checked=validDay(snapshot?.lastChecked)?snapshot.lastChecked:null;
    const stale=checked&&(+fromDay(today)-+fromDay(checked))/86400000>7;
    note.textContent=`A few local highlights, not a complete calendar.${checked?' Last checked '+label(checked)+'.':''}${failed&&snapshot?' Unable to refresh; showing the last loaded listings.':''}${stale?' Listings may be out of date.':''} Check the source for times, tickets and changes.`;
  }
  async function refresh() {
    if(disposed)return;
    // Drop yesterday's events immediately, even while offline or fetching.
    render();
    if(busy)return;busy=true;
    controller=new AbortController();
    const timeout=window.setTimeout(()=>controller?.abort(),10000);
    try {
      const response=await fetch('/events/events-data.json',{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('Events unavailable');
      const data=await response.json();
      if(data.timezone!==TIME_ZONE||!Array.isArray(data.events))throw new Error('Invalid events');
      snapshot=data;failed=false;
    }catch{failed=true;}
    finally {
      window.clearTimeout(timeout);busy=false;
      if(!disposed)render();
    }
  }
  void refresh();
  const poll=window.setInterval(()=>{if(!document.hidden)void refresh();},REFRESH_INTERVAL);
  const rollover=window.setInterval(()=>{if(!document.hidden&&dayKey(now())!==displayedDay)void refresh();},DATE_CHECK_INTERVAL);
  const resume=()=>{if(!document.hidden)void refresh();};
  const pageshow=event=>{if(event.persisted)resume();};
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('pageshow',pageshow);
  window.addEventListener('online',resume);
  return () => {
    disposed=true;controller?.abort();
    window.clearInterval(poll);window.clearInterval(rollover);
    document.removeEventListener('visibilitychange',resume);
    window.removeEventListener('pageshow',pageshow);
    window.removeEventListener('online',resume);
  };
}

// Old cached app bundles can still mount the current, smaller section.
export const monthSection = upcomingSection;
export const mountMonthEvents = mountUpcomingEvents;
