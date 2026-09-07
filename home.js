/* Silent excerpts from the approved film, plus restrained scroll motion. */
(() => {
  'use strict';
  const frame=document.getElementById('film-teaser'),reel=document.getElementById('home-reel');
  const toggle=document.getElementById('teaser-toggle'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const excerpts=[[.8,4.62],[13.7,19.5],[24.05,29.65]];
  let visible=false,ready=false,wants=!reduced.matches,filmOpen=false,excerpt=0,raf=0;
  const api=()=>frame.contentWindow?.filmPreview;
  function sync(){
    const running=ready&&visible&&wants&&!document.hidden&&!filmOpen;
    if(running&&!api().getState().playing)api().play();
    if(!running&&ready)api().pause();
    toggle.setAttribute('aria-label',wants?'Pause silent film preview':'Play silent film preview');
    toggle.setAttribute('aria-pressed',String(!wants));toggle.firstElementChild.textContent=wants?'Ⅱ':'▶';
    cancelAnimationFrame(raf);if(running)raf=requestAnimationFrame(tick);
  }
  function tick(){
    const state=api().getState(),end=excerpts[excerpt][1];
    if(state.time>=end){excerpt=(excerpt+1)%excerpts.length;api().seek(excerpts[excerpt][0]);api().play();}
    const t=api().getState().time,start=excerpts[excerpt][0];
    frame.style.opacity=String(Math.min(1,(t-start)/.2,(excerpts[excerpt][1]-t)/.2));
    raf=requestAnimationFrame(tick);
  }
  function initialize(){if(ready)return;ready=!!api();if(ready){api().seek(reduced.matches?3.2:excerpts[0][0]);sync();}}
  frame.addEventListener('load',initialize);initialize();
  new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync();},{threshold:0}).observe(reel);
  toggle.addEventListener('click',()=>{wants=!wants;sync();frame.style.opacity='1';});
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('bridgepit:film-open',()=>{filmOpen=true;sync();});
  document.addEventListener('bridgepit:film-close',()=>{filmOpen=false;sync();});
  reduced.addEventListener('change',()=>{if(reduced.matches){wants=false;sync();frame.style.opacity='1';}drift();});
  const items=[...document.querySelectorAll('[data-drift]')];let scheduled=false;
  function drift(){
    scheduled=false;
    const disabled=reduced.matches||innerWidth<=700,mid=innerHeight/2;
    items.forEach(el=>{
      const rect=el.getBoundingClientRect(),previous=parseFloat(el.style.getPropertyValue('--shift'))||0;
      const offset=Math.max(-1,Math.min(1,(mid-(rect.top-previous+rect.height/2))/innerHeight));
      el.style.setProperty('--shift',(disabled?0:offset*Number(el.dataset.drift)).toFixed(2)+'px');
    });
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(drift);}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);drift();
})();
