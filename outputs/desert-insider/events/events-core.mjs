export const TIME_ZONE = 'America/Los_Angeles';
export const dayKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {timeZone: TIME_ZONE, year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const fromDay = key => new Date(`${key}T12:00:00Z`);
export const keyOf = date => date.toISOString().slice(0,10);
export const shiftDay = (key, amount) => { const date = fromDay(key); date.setUTCDate(date.getUTCDate()+amount); return keyOf(date); };
export const monthOf = key => key.slice(0,7);
export const shiftMonth = (month, amount) => { const date=fromDay(`${month}-01`); date.setUTCMonth(date.getUTCMonth()+amount); return keyOf(date).slice(0,7); };
export function monthDays(month) { const first=`${month}-01`; const start=shiftDay(first,-fromDay(first).getUTCDay()); return Array.from({length:42},(_,i)=>shiftDay(start,i)); }
export const coversDay = (event, day) => event.startDate <= day && (event.endDate || event.startDate) >= day;
export const eventSourceKey = event => { try { return new URL(event.url).hostname.replace(/^www\./,'')==='visitgreaterpalmsprings.com' ? 'vgps' : 'other'; } catch { return 'other'; } };
export function eventTone(event) {
  const category=String(event.category ?? '').trim().replace(/\s+/g,' ').toLowerCase();
  return ['arts & culture','festivals & markets'].includes(category) ? 'rose' : 'teal';
}
export function matchesFilters(event, {query='',city='',category='',source='',range='upcoming',today=dayKey(),month=monthOf(today),selectedDay=null} = {}) {
  if ((event.endDate || event.startDate) < today || ['cancelled','postponed'].includes(event.status)) return false;
  if (source && eventSourceKey(event)!==source) return false;
  if (city && event.city!==city || category && event.category!==category) return false;
  if (query && ![event.title,event.venue,event.city,event.category].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) return false;
  if (selectedDay) return coversDay(event, selectedDay);
  if (range==='month') return event.startDate <= `${month}-31` && (event.endDate||event.startDate) >= `${month}-01`;
  if (range==='weekend') { const weekday=fromDay(today).getUTCDay(); const friday=shiftDay(today, weekday===0 ? -2 : 5-weekday); return event.startDate<=shiftDay(friday,2) && (event.endDate||event.startDate)>=friday; }
  return true;
}
export function validateEvent(event) {
  if (!event.id || !event.title || !event.city || !event.venue || !event.sourceName || !event.checkedAt) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.startDate) || Number.isNaN(+fromDay(event.startDate)) || keyOf(fromDay(event.startDate))!==event.startDate) return false;
  if (event.endDate && event.endDate<event.startDate) return false;
  try { return new URL(event.url).protocol==='https:'; } catch { return false; }
}
