(() => {
  'use strict';
  let queued=false;
  function add(){
    const nav=document.querySelector('nav, .nav, .top-nav, .section-nav');
    if(!nav||nav.querySelector('a[href="live.html"]'))return;
    const link=document.createElement('a');
    link.href='live.html';
    link.textContent='Live';
    link.className='nav-link';
    nav.appendChild(link);
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;add()})}
  document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(queue).observe(document.getElementById('adminApp')||document.body,{childList:true,subtree:true});queue()});
})();