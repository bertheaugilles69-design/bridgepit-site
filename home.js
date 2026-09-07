/* Silent excerpts from the approved film, plus the scroll-driven alert journey. */
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
  reduced.addEventListener('change',()=>{
    if(reduced.matches){wants=false;sync();frame.style.opacity='1';}
    resetJourneyMotion();scheduleJourney();
  });

  // Untransformed wrappers are stable scroll anchors. Measuring a moving panel
  // (or its children) would feed its own animation back into the next frame.
  const steps=[...document.querySelectorAll('.journey-step')].map(el=>({el,direction:Number(el.dataset.direction),position:null}));
  const motionProperties=['--journey-x','--journey-y','--journey-tilt','--journey-scale','--artifact-x','--artifact-y','--artifact-tilt'];
  let journeyFrame=0,lastJourneyTime=0;
  function renderJourney(now){
    journeyFrame=0;
    if(reduced.matches||document.hidden)return;
    const height=innerHeight,mobile=innerWidth<=700;
    const elapsed=lastJourneyTime?Math.min(now-lastJourneyTime,64):16;
    const ease=1-Math.exp(-elapsed/90);
    lastJourneyTime=now;
    // Read all layout before writing any transforms.
    const bounds=steps.map(step=>step.el.getBoundingClientRect());
    let settling=false;
    steps.forEach((step,index)=>{
      const rect=bounds[index],near=rect.bottom>-160&&rect.top<height+160;
      const target=Math.max(-1,Math.min(1,(height/2-rect.top-rect.height/2)/(height/2+rect.height/2)));
      if(step.position===null||!near)step.position=target;
      else if(Math.abs(target-step.position)<.001)step.position=target;
      else{step.position+=(target-step.position)*ease;settling=true;}
      const p=step.position,d=step.direction;
      const values=[
        (mobile?0:d*p*30).toFixed(2)+'px',
        (-p*(mobile?22:38)).toFixed(2)+'px',
        (mobile?0:d*p*1.15).toFixed(3)+'deg',
        (1-Math.abs(p)*(mobile?.015:.03)).toFixed(4),
        (mobile?0:-d*p*14).toFixed(2)+'px',
        (p*(mobile?12:30)).toFixed(2)+'px',
        (mobile?0:-d*p*.7).toFixed(3)+'deg'
      ];
      motionProperties.forEach((property,i)=>step.el.style.setProperty(property,values[i]));
      step.el.classList.toggle('is-near',near);
    });
    if(settling)journeyFrame=requestAnimationFrame(renderJourney);
    else lastJourneyTime=0;
  }
  function scheduleJourney(){
    if(!journeyFrame&&!reduced.matches&&!document.hidden)journeyFrame=requestAnimationFrame(renderJourney);
  }
  function resetJourneyMotion(){
    cancelAnimationFrame(journeyFrame);journeyFrame=0;lastJourneyTime=0;
    steps.forEach(step=>{
      step.position=null;step.el.classList.remove('is-near');
      motionProperties.forEach(property=>step.el.style.removeProperty(property));
    });
  }
  addEventListener('scroll',scheduleJourney,{passive:true});
  addEventListener('resize',scheduleJourney);
  addEventListener('pageshow',()=>{resetJourneyMotion();scheduleJourney();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(journeyFrame);journeyFrame=0;lastJourneyTime=0;}
    else scheduleJourney();
  });
  new ResizeObserver(scheduleJourney).observe(document.querySelector('.journey-panels'));
  document.fonts.ready.then(scheduleJourney);
  scheduleJourney();
})();
