(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const frame=$('#product-frame'), viewport=$('#screen-viewport'), panel=$('#product-panel');
  const rig=$('#screen-rig'), stage=$('#product-stage'), nav=$('.site-nav');
  const scrub=$('#demo-scrub'), play=$('#demo-play'), dialog=$('#film-dialog');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const query=new URLSearchParams(location.search);
  let scene='dashboard', time=0, playing=false, ready=false, expanded=false, hasPlayed=false;
  let wantsPlayback=!reduced.matches&&!query.has('at')&&!query.has('scene'), onScreen=false;
  let lastTick=0, sentAt=0, captionKey='', resumeAfterFilm=false;
  let cameraKey='',userPanned=false,scrollBeforeExpand=0;
  window.__conceptQA={errors:[],state:null};
  window.addEventListener('error',e=>window.__conceptQA.errors.push(e.message));
  const names={dashboard:'Dashboard',execution:'Follow an alert',limits:'Account limits'};
  let duration=BridgePitExample.durations.dashboard;
  const clock=t=>'0:'+String(Math.floor(t)).padStart(2,'0');
  const screenHeight=()=>window.visualViewport?.height||window.innerHeight;
  function fit(){
    // Fit the real application's complete composition within the opening.
    panel.style.width=expanded?'':stage.clientWidth+'px';
    const mobile=(expanded?panel.clientWidth:stage.clientWidth)<700;
    panel.classList.toggle('can-pan',mobile);
    let scale, h;
    if(expanded){
      viewport.style.height='';
      h=viewport.clientHeight;
      scale=mobile?1:Math.min(viewport.clientWidth/1280,h/780);
    }else{
      const layout=getComputedStyle($('.opening-layout'));
      const heading=$('.showcase-heading'), caption=$('.scene-caption');
      const surrounding=heading.offsetHeight+parseFloat(getComputedStyle(heading).marginBottom)+caption.offsetHeight+(caption.offsetHeight?parseFloat(getComputedStyle(caption).marginTop):0);
      const intro=$('.opening-copy');
      const introduction=intro.offsetHeight+parseFloat(getComputedStyle(intro).marginBottom);
      const padding=parseFloat(layout.paddingTop)+parseFloat(layout.paddingBottom);
      const controls=$('.demo-transport').offsetHeight+$('.pan-hint').offsetHeight+2;
      const alongside=layout.display==='grid';
      const available=Math.max(1,screenHeight()-nav.offsetHeight-surrounding-controls-padding-(mobile||alongside?0:introduction));
      scale=mobile?.9:Math.min((stage.clientWidth-2)/1280,available/780);
      h=mobile?Math.min(540,available):780*scale;
      if(!mobile)panel.style.width=(1280*scale+2)+'px';
      viewport.style.height=h+'px';
      $('.showcase').style.setProperty('--player-width',panel.style.width);
    }
    const w=viewport.clientWidth;
    rig.style.width=1280*scale+'px';
    rig.style.height=(mobile?h:780*scale)+'px';
    rig.style.top=expanded&&!mobile?Math.max(0,(h-780*scale)/2)+'px':'0';
    frame.style.transform=`scale(${scale})`;
    frame.style.height=(mobile?Math.round(h/scale):780)+'px';
    viewport.style.overflowX=mobile?'auto':'hidden';
    const focus=scene==='dashboard'?(time>=4?754:254):scene==='execution'?(time>=1.45?750:254):254;
    const key=scene+':'+focus+':'+Math.round(w)+':'+expanded;
    if(key!==cameraKey&&!userPanned){cameraKey=key;viewport.scrollTo({left:mobile?Math.max(0,focus*scale-12):0,behavior:playing&&!reduced.matches?'smooth':'instant'});}
  }
  function revealPlayer(){
    if(expanded)return;
    const rect=panel.getBoundingClientRect(), top=nav.offsetHeight+12;
    if(rect.top>=top&&rect.bottom<=screenHeight()-16)return;
    const target=panel.classList.contains('can-pan')?$('.showcase-heading'):$('.opening');
    window.scrollTo({top:window.scrollY+target.getBoundingClientRect().top-top,behavior:reduced.matches?'instant':'smooth'});
  }
  function caption(){
    const mobile=panel.classList.contains('can-pan')&&!expanded;
    let title,body,part='';
    if(scene==='dashboard'){
      part=mobile?(time>=4?'b':'a'):'all';
      title=mobile?(time>=4?'Eval 100K · Its own size and limit.':'Funded 50K · P&L, positions and limits.'):'Two accounts. Their own positions. Their own limits.';
      body='An eight-second loop with illustrative market updates.';
    }else if(scene==='execution'){
      if(time<.65){part='0';title='Follow the order through recent activity.';}
      else if(time<1.45){part='1';title='Order sent. Waiting for the fill.';}
      else if(time<2.35){part='2';title='Fill recorded. Two contracts open.';}
      else if(time<3.5){part='3';title='Safety stop placed with the broker.';}
      else if(time<7.1){part='4';title='Duplicate refused. Position unchanged.';}
      else{part='5';title='Stop resting. Confirmed by the broker.';}
      body='Condensed example. Original event timestamps retained.';
    }else{
      if(time<3){part='1';title='Daily stop. The limit you choose.';}
      else if(time<6){part='2';title='A buffer above your account’s floor.';}
      else{part='3';title='16:05 New York time. Set by you.';}
      body='Funded accounts and your own brokerage have separate rules.';
    }
    const key=scene+part;
    if(key!==captionKey){captionKey=key;$('#caption-title').textContent=title;$('#caption-text').textContent=body;$('#caption-step').textContent=String(['dashboard','execution','limits'].indexOf(scene)+1).padStart(2,'0')+' / '+names[scene];}
  }
  function paint(immediate=false){
    scrub.max=String(duration);scrub.value=String(time);$('#demo-time').textContent=clock(time)+' / '+clock(duration);
    scrub.style.setProperty('--progress',(time/duration*100).toFixed(2)+'%');
    $('#demo-play-icon').textContent=playing?'Ⅱ':'▶';$('#demo-play-label').textContent=playing?'Pause':time>=duration?'Replay':'Play';
    $('.transport-note').textContent=scene==='execution'?'Condensed example':'Example data';
    $('#caption-duration').textContent=scene==='dashboard'?'8-second loop':duration+'-second example';
    play.setAttribute('aria-label',playing?'Pause example session':time>=duration?'Replay example session':'Play example session');
    if(immediate||panel.classList.contains('can-pan'))fit();caption();
    if(ready)frame.contentWindow.postMessage({type:'bridgepit:seek',scene,time,playing,immediate:immediate||reduced.matches},location.origin);
  }
  function syncPlayback(){
    const next=ready&&wantsPlayback&&!document.hidden&&!dialog.open&&(onScreen||expanded);
    if(next!==playing){playing=next;if(next)hasPlayed=true;lastTick=performance.now();paint(true);}
  }
  function pause(){wantsPlayback=false;syncPlayback();paint(true);}
  function select(next,start=!reduced.matches){
    scene=next;time=0;duration=BridgePitExample.durations[next];hasPlayed=true;captionKey='';userPanned=false;cameraKey='';wantsPlayback=start;
    $$('[data-scene]').forEach(b=>{const active=b.dataset.scene===scene;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    panel.setAttribute('aria-labelledby','tab-'+scene);lastTick=performance.now();paint(true);syncPlayback();
  }
  function toggle(){
    if(!ready)return;
    if(playing){pause();return;}
    if(time>=duration||!hasPlayed)time=0;
    hasPlayed=true;wantsPlayback=true;syncPlayback();paint(true);revealPlayer();
  }
  play.addEventListener('click',toggle);
  $('#demo-replay').addEventListener('click',()=>{time=0;hasPlayed=true;wantsPlayback=true;lastTick=performance.now();syncPlayback();paint(true);revealPlayer();});
  scrub.addEventListener('input',()=>{wantsPlayback=false;playing=false;hasPlayed=true;time=Number(scrub.value);paint(true);});
  $$('[data-scene]').forEach(b=>b.addEventListener('click',()=>{select(b.dataset.scene);revealPlayer();}));
  $('.scene-tabs').addEventListener('keydown',e=>{
    const tabs=$$('[data-scene]'),at=tabs.indexOf(document.activeElement);if(at<0)return;
    let n=at;
    if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(at+1)%tabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(at+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;
    e.preventDefault();tabs[n].focus();select(tabs[n].dataset.scene);revealPlayer();
  });
  const expand=$('#expand-demo');
  function setExpanded(on){
    if(on)scrollBeforeExpand=window.scrollY;
    stage.style.height=on?panel.offsetHeight+'px':'';
    expanded=on;panel.classList.toggle('expanded',on);document.body.style.overflow=on?'hidden':'';
    $('.opening').classList.toggle('has-expanded',on);
    expand.innerHTML=on?'<span class="expand-label">Close</span> <span aria-hidden="true">×</span>':'<span class="expand-label">Enlarge</span> <span aria-hidden="true">⤢</span>';
    expand.setAttribute('aria-label',on?'Close enlarged application showcase':'Enlarge the application showcase');
    panel.setAttribute('role',on?'dialog':'tabpanel');if(on)panel.setAttribute('aria-modal','true');else panel.removeAttribute('aria-modal');
    userPanned=false;cameraKey='';
    // Refit before restoring focus so Safari never scrolls to a temporary,
    // full-height iframe while the enlarged view is collapsing.
    paint(true);syncPlayback();
    if(!on)window.scrollTo({top:scrollBeforeExpand,behavior:'instant'});
    requestAnimationFrame(()=>{paint(true);if(!on)window.scrollTo({top:scrollBeforeExpand,behavior:'instant'});});
  }
  expand.addEventListener('click',()=>setExpanded(!expanded));
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&expanded){setExpanded(false);expand.focus({preventScroll:true});}
    if(e.key==='Tab'&&expanded){const list=[...panel.querySelectorAll('button,input,[tabindex="0"]')];const i=list.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();list.at(-1).focus();}else if(!e.shiftKey&&(i<0||i===list.length-1)){e.preventDefault();list[0].focus();}}
  });
  viewport.addEventListener('pointerdown',()=>{if(panel.classList.contains('can-pan')){userPanned=true;pause();}});
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
    if(e.data?.type==='bridgepit:ready'){
      ready=true;$('#screen-loading').hidden=true;paint(true);syncPlayback();
      frame.contentDocument.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded){e.preventDefault();setExpanded(false);expand.focus({preventScroll:true});}});
    }
    if(e.data?.type==='bridgepit:state')window.__conceptQA.state=e.data;
    if(e.data?.type==='bridgepit:error'){window.__conceptQA.errors.push(e.data.error);$('#screen-loading').hidden=false;$('#screen-loading').textContent='The example could not load. Please refresh the page.';}
  });
  window.addEventListener('resize',()=>paint(true));
  window.visualViewport?.addEventListener('resize',()=>paint(true));
  document.fonts.ready.then(()=>paint(true));
  document.addEventListener('visibilitychange',syncPlayback);
  reduced.addEventListener('change',()=>{if(reduced.matches)pause();});
  const visibility=new IntersectionObserver(es=>{onScreen=es[0].isIntersecting&&es[0].intersectionRatio>=.2;syncPlayback();},{threshold:[0,.2]});visibility.observe(panel);
  function tick(now){
    if(playing){time+=(now-lastTick)/1000;lastTick=now;if(time>=duration){if(scene==='dashboard'){time%=duration;cameraKey='';}else{time=duration;playing=false;wantsPlayback=false;}}if(now-sentAt>100||!playing){sentAt=now;paint();}}
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  document.addEventListener('bridgepit:film-open',()=>{resumeAfterFilm=wantsPlayback;pause();});
  document.addEventListener('bridgepit:film-close',()=>{wantsPlayback=resumeAfterFilm;syncPlayback();});
  $$('[data-demo-link]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();select(link.dataset.demoLink);revealPlayer();}));
  window.conceptPreview={
    seek:(next,t)=>{select(next,false);time=Math.max(0,Math.min(duration,Number(t)||0));hasPlayed=true;paint(true);},
    getState:()=>({scene,time,playing,ready,expanded,...window.__conceptQA}),
    pause
  };
  if(query.has('scene')&&names[query.get('scene')]){select(query.get('scene'),false);time=Math.max(0,Math.min(duration,Number(query.get('at'))||0));hasPlayed=true;}
  paint(true);
})();
