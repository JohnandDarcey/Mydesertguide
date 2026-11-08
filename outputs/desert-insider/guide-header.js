/* Shared header enhancement. Native links/details work without this script. */
(() => {
 const markCurrent = () => document.querySelectorAll('.mdg-header a[href]').forEach(link=>{
   const url=new URL(link.getAttribute('href'),location.href);
   if(!url.hash&&url.pathname===location.pathname)link.setAttribute('aria-current','page');
 });
 document.addEventListener('DOMContentLoaded',markCurrent);
 document.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   document.querySelectorAll('.mdg-menu[open]').forEach(menu=>{menu.removeAttribute('open');menu.querySelector('summary').focus();});
 });
 document.addEventListener('click',event=>{
   document.querySelectorAll('.mdg-menu[open]').forEach(menu=>{if(!menu.contains(event.target)||event.target.closest('a'))menu.removeAttribute('open');});
 });
})();
