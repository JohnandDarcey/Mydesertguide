import {TIME_ZONE,dayKey,fromDay,monthOf,shiftMonth,monthDays,coversDay,matchesFilters,validateEvent,eventSourceKey,eventTone} from './events-core.mjs';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=dayKey();
const state={query:'',city:'',category:'',source:'',range:'upcoming',today,month:monthOf(today),selectedDay:null,view:'calendar'};
const requestedView=new URLSearchParams(window.location.search);
if(requestedView.get('range')==='month')state.range='month';
if(requestedView.get('source')==='vgps'){state.source='vgps';$('#event-source').value='vgps';}
if(requestedView.get('view')==='list')state.view='list';
let events=[];
let lastChecked=null;
const longDate = key => fromDay(key).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',day:'numeric',year:'numeric'});
const shortDate = key => fromDay(key).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric'});
const dateLabel = event => `${longDate(event.startDate)}${event.endDate && event.endDate!==event.startDate ? ` – ${longDate(event.endDate)}` : ''}`;
function renderFeature() {
  const event=events.find(e=>(e.endDate||e.startDate)>=today && (!state.source || eventSourceKey(e)===state.source));
  if (!event) { $('#event-feature').innerHTML='<div class="events-feature-kicker">Make a little room for fun <span aria-hidden="true">✳</span></div><h2>A date with the desert.</h2><p class="events-feature-meta">Explore the calendar below.</p><a href="#calendar">Find your next plan <span aria-hidden="true">↗</span></a>'; return; }
  $('#event-feature').innerHTML=`<div class="events-feature-kicker">On the calendar <span aria-hidden="true">✳</span></div><h2>${escape(event.title)}</h2><p class="events-feature-meta">${escape(dateLabel(event))}<br>${escape(event.venue)} · ${escape(event.city)}</p><a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">View official event <span aria-hidden="true">↗</span></a>`;
}
function renderCalendar() {
  $('#event-calendar-view').hidden=state.view!=='calendar';
  $('#event-month').textContent=fromDay(`${state.month}-01`).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'});
  const monthStart=fromDay(`${state.month}-01`);
  const monthLength=new Date(Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth()+1,0)).getUTCDate();
  const visibleDays=Math.ceil((monthStart.getUTCDay()+monthLength)/7)*7;
  const calendarEvents=events.filter(e=>matchesFilters(e,{...state,selectedDay:null,range:state.range==='month'?'upcoming':state.range}));
  $('#event-grid').innerHTML=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=>`<div class="event-weekday">${day}</div>`).join('')+monthDays(state.month).slice(0,visibleDays).map(day=>{
    const matches=calendarEvents.filter(e=>coversDay(e,day));
    const outside=monthOf(day)!==state.month;
    const selected=state.selectedDay===day;
    return `<div class="event-day${outside?' outside':''}${day<today?' past':''}${day===today?' today':''}${selected?' selected':''}"><button type="button" class="event-date" data-day="${day}" aria-pressed="${selected}" aria-label="${escape(longDate(day))}, ${matches.length} ${matches.length===1?'event':'events'}${day===today?', today':''}" ${day<today?'disabled':''}>${Number(day.slice(-2))}</button>${matches.slice(0,2).map(e=>`<a class="event-calendar-link" data-tone="${eventTone(e)}" href="${escape(e.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(e.title)}, official event details" title="${escape(e.title)}">${escape(e.title)}</a>`).join('')}${matches.length>2?`<button type="button" class="event-more" data-day="${day}">+${matches.length-2} more</button>`:''}${matches.length?`<span class="event-mobile-dots" aria-hidden="true">${matches.slice(0,3).map(()=>'<i></i>').join('')}</span>`:''}</div>`;
  }).join('');
}
function renderList() {
  const filtered=events.filter(e=>matchesFilters(e,state));
  $('#event-results-title').textContent=state.selectedDay?longDate(state.selectedDay):state.range==='weekend'?'This weekend in the valley':state.range==='month'?`In ${fromDay(state.month+'-01').toLocaleDateString('en-US',{timeZone:'UTC',month:'long'})}`:'Coming up in the valley';
  $('#event-results-count').textContent=`${filtered.length} ${filtered.length===1?'event':'events'} · Pacific time`;
  $('#event-list').innerHTML=filtered.length?filtered.map(event=>{
    const date=fromDay(event.startDate);
    return `<article class="event-card"><div class="event-date-block" aria-label="${escape(dateLabel(event))}"><span>${date.toLocaleDateString('en-US',{timeZone:'UTC',month:'short'})}</span><strong>${date.getUTCDate()}</strong><span>${date.toLocaleDateString('en-US',{timeZone:'UTC',weekday:'short'})}</span></div><div><div class="event-card-category">${escape(event.category)}</div><h4 class="event-card-title"><a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">${escape(event.title)}</a></h4><p class="event-card-info">${escape(event.venue)} · ${escape(event.city)}<br>${escape(dateLabel(event))} · ${escape(event.timeLabel||'Times: see organizer')}</p><p class="event-card-source">Source: <a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">${escape(event.sourceName)}</a> · Checked ${escape(shortDate(event.checkedAt))}${event.scheduleNote ? `<br>${escape(event.scheduleNote)}`:''}</p></div><a class="event-card-link" href="${escape(event.url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${escape(event.title)} on official website (opens in new tab)">Event details <span aria-hidden="true">↗</span></a></article>`;
  }).join(''):`<div class="event-empty"><h3>${events.length?'No plans found. Yet.':'The calendar is taking shape.'}</h3><p>${events.length?'There are no source-checked events matching those filters. Try another date or clear the filters.':'An approved event source is not connected yet. The calendar is ready for verified listings, with no invented events.'}</p>${events.length?'<button type="button" data-reset>Show all upcoming events</button>':''}</div>`;
}
function render() {
  document.querySelectorAll('[data-range]').forEach(button=>button.setAttribute('aria-pressed',String(!state.selectedDay&&button.dataset.range===state.range)));
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===state.view)));
  renderFeature();renderCalendar();renderList();
}
function reset(){Object.assign(state,{query:'',city:'',category:'',source:'',range:'upcoming',month:monthOf(today),selectedDay:null});$('#event-search').value='';$('#event-city').value='';$('#event-category').value='';$('#event-source').value='';render();}
$('#event-search').addEventListener('input',event=>{state.query=event.target.value;state.selectedDay=null;render();});
for(const name of ['city','category','source']) $(`#event-${name}`).addEventListener('change',event=>{state[name]=event.target.value;state.selectedDay=null;render();});
$('#event-clear').addEventListener('click',reset);
$('#month-prev').addEventListener('click',()=>{state.month=shiftMonth(state.month,-1);state.selectedDay=null;render();});
$('#month-next').addEventListener('click',()=>{state.month=shiftMonth(state.month,1);state.selectedDay=null;render();});
$('#month-today').addEventListener('click',()=>{state.month=monthOf(today);state.selectedDay=today;state.range='upcoming';render();});
$('#calendar').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.view){state.view=button.dataset.view;render();}
  if(button.dataset.range){state.range=button.dataset.range;state.selectedDay=null;if(state.range==='month')state.month=monthOf(today);render();}
  if(button.dataset.day){state.selectedDay=state.selectedDay===button.dataset.day?null:button.dataset.day;state.month=monthOf(button.dataset.day);render();}
  if(button.hasAttribute('data-reset'))reset();
});
async function init(){
  render();
  try{
    const response=await fetch('./events-data.json',{cache:'no-store'});if(!response.ok)throw new Error('Event data unavailable');
    const data=await response.json();if(data.timezone!==TIME_ZONE||!Array.isArray(data.events))throw new Error('Invalid event data');
    lastChecked=data.lastChecked;
    events=data.events.filter(validateEvent).filter(e=>!['cancelled','postponed'].includes(e.status)).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title));
    for(const name of ['city','category']){const options=[...new Set(events.map(e=>e[name]))].sort();$(`#event-${name}`).innerHTML=`<option value="">${name==='city'?'All cities':'All categories'}</option>`+options.map(value=>`<option value="${escape(value)}">${escape(value)}</option>`).join('');}
    const checked=data.lastChecked?` Last checked ${longDate(data.lastChecked)}.`:'';
    const syncLabel=data.sync?.enabled?'Daily updates are scheduled. Coverage is still being expanded.':'Automatic updates are not connected.';
    const preferredCount=events.filter(event=>eventSourceKey(event)==='vgps').length;
    $('#event-data-status').innerHTML=`<strong>${events.length ? `${events.length} listings across all sources · ${preferredCount} from Visit Greater Palm Springs.`:'Events calendar.'}</strong>${escape(checked)} ${syncLabel}`;
    if(data.lastChecked && today>data.lastChecked && (+fromDay(today)-+fromDay(data.lastChecked))/86400000>7)$('#event-data-status').innerHTML+=` <strong>Listings may be out of date. Please check the organizer.</strong>`;
    renderFeature();render();
  }catch(error){$('#event-data-status').innerHTML='<strong>Event listings are temporarily unavailable.</strong> Please try again later. The current sync status could not be verified.';$('#event-list').innerHTML='<div class="event-empty"><h3>We couldn’t load the calendar.</h3><p>Please reload this page to try again. You can still visit the official event sources directly.</p><a href="https://www.visitgreaterpalmsprings.com/events/" target="_blank" rel="noopener noreferrer">Visit Greater Palm Springs events ↗</a></div>';}
}
init();
