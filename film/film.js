/* Film 03. Pure timeline: a seek and a normal playback produce the same state.
 * No broker connection, network request or live dashboard code is executed.
 * The real product event renderer is used only to render the example records.
 */
(() => {
 'use strict';
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const data=window.FILM_TIMELINE, duration=data.duration, audio=$('#voice'), cinema=$('#cinema');
 const segs=Object.fromEntries(data.segments.map(s=>[s.id,s]));
 const chapterDefs=[['execution','Execution'],['stop','Safety stop'],['accounts','Accounts'],['duplicate','Duplicate'],['phone','Phone control'],['close','The close'],['end','BridgePit']];
 const chapters=chapterDefs.map(([id,label],i)=>({id,label,start:Math.max(0,segs[id].start-.15),index:i+1}));
 const state={t:0,playing:false,sound:false,soundChosen:false,cc:false,scene:'',start:0,wall:0,raf:0,chatKey:'',ended:false};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const ease=v=>1-Math.pow(1-clamp(v),3);
 const smooth=v=>{const p=clamp(v);return p*p*(3-2*p)};
 const reveal=(t,d=.5)=>reduced?(t>=0?1:0):smooth(t/d);
 const captions=data.segments.flatMap(s=>{
  const words=s.text.split(/\s+/), chunks=[], size=Math.ceil(words.length/Math.ceil(words.length/9));
  for(let i=0;i<words.length;i+=size)chunks.push({start:s.start+(s.end-s.start)*i/words.length,end:s.start+(s.end-s.start)*Math.min(i+size,words.length)/words.length,text:words.slice(i,i+size).join(' ')});
  return chunks;
 });
 const fmt=t=>`${Math.floor(Math.max(0,t)/60)}:${String(Math.floor(Math.max(0,t)%60)).padStart(2,'0')}`;
 function txt(sel,value){const el=$(sel);if(el&&el.textContent!==value)el.textContent=value;}
 function eventRow(kind,record,cue){
  const d=eventDetail(kind,record), good=['RITHMIC_FILL','PROTECTIVE_STOP_VERIFIED'].includes(kind);
  return `<div class="product-event" data-cue="${cue}"><div class="event-tag${good?' good':''}">${esc(d.label)}</div><div class="event-content">${d.detail}</div></div>`;
 }
 $('#execution-events').innerHTML=eventRow('ORDER',{action:'buy',qty:2,contract:'MNQU6',account:'50K-01',broker:'RITHMIC'},1.85)+eventRow('RITHMIC_FILL',{side:'BUY',size:2,symbol:'MNQU6',price:23412.25},2.55);
 $('#stop-events').innerHTML=eventRow('PROTECTIVE_STOP_SET',{trigger:23362.25,qty:2,contract:'MNQU6',account:'50K-01'},2.6)+eventRow('PROTECTIVE_STOP_VERIFIED',{trigger:23362.25,contract:'MNQU6',account:'50K-01',status:'working'},5.4);
 $('.chapters').innerHTML=chapters.map(c=>`<button data-chapter="${c.id}"><span>${String(c.index).padStart(2,'0')}</span>${c.label}</button>`).join('');
 function currentChapter(t){return [...chapters].reverse().find(c=>t>=c.start)||chapters[0]}
 function sceneLocal(t,id){return t-(segs[id].start-.15)}
 const chatStart=segs.halt.start-(segs.phone.start-.15);
 const chatMessages=[
  [.12,'user','/pnl'],
  [.65,'bot','<b>📊 P&L 09:50 ET</b>\nFunded 50K\n  day +$46.00 · bal $51,501.00 · MNQU6 +2\nEval 100K\n  day +$69.00 · bal $100,530.00 · MNQU6 +3\nLIVE · active'],
  [3.5,'user','/path'],
  [4.1,'bot','BridgePit is up. This Mac can receive TradingView signals now: entries, exits, and the end-of-day flatten.'],
  [chatStart+.05,'user','/halt'],
  [chatStart+.4,'bot','⚠️ /halt will block all entries. Reply YES within 60s to confirm.'],
  [chatStart+1.2,'user','YES'],
  [chatStart+1.75,'bot final','HALTED. Entries blocked; exits and EOD flatten still run. /resume to re-arm.']
 ];
 $('#chat-messages').innerHTML=chatMessages.map(m=>`<div class="chat-bubble ${m[1]}" hidden>${m[2]}<small>20:50</small></div>`).join('');
 const chatNodes=$$('#chat-messages .chat-bubble');
 function paintChat(local){
  const visible=chatMessages.filter(m=>local>=m[0]);
  const key=visible.length+':'+(innerWidth<=560?'m':'d');
  if(key!==state.chatKey){
   state.chatKey=key;
   chatNodes.forEach((el,i)=>{el.hidden=i>=visible.length});
   const box=$('.chat-viewport'),list=$('#chat-messages'),last=chatNodes[visible.length-1];
   const available=box.clientHeight-(innerWidth<=560?22:26);
   state.chatScroll={to:Math.max(0,list.scrollHeight-available),from:Math.max(0,list.scrollHeight-(last?last.offsetHeight+9:0)-available),start:visible.length?visible.at(-1)[0]:0};
  }
  const scroll=state.chatScroll;
  $('#chat-messages').style.transform=`translateY(-${scroll.from+(scroll.to-scroll.from)*reveal(local-scroll.start,local>=chatStart?.4:.65)}px)`;
  chatNodes.forEach((el,i)=>{if(el.hidden)return;const p=reveal(local-chatMessages[i][0],.4);el.style.opacity=p;el.style.transform=`translateY(${chatMessages[i][1]==='user'?0:(1-p)*5}px)`});
  const phase=reveal(local-chatStart,.48),halted=local>=chatStart+1.75;
  $('.phone-title-status').style.opacity=1-phase;
  $('.phone-title-halt').style.opacity=phase;
  $('.phone-title-status').setAttribute('aria-hidden',String(phase>=.5));
  $('.phone-title-halt').setAttribute('aria-hidden',String(phase<.5));
  $('#phone-desk-state').classList.toggle('halted',halted);
  txt('#phone-desk-state strong',halted?'Halted by you':'Live');
  txt('#phone-desk-foot',halted?'Entries blocked. Exits and the close still run.':'Your Mac stays awake and connected.');
  txt('#phone-consequence',halted?'Your positions stay open. Your exits still work.':'Check the connection. Keep control from your phone.');
 }
 const scenes=chapters.map((c,i)=>({...c,el:$('#'+c.id),next:chapters[i+1]?.start??Infinity,cues:$$('#'+c.id+' [data-cue]')}));
 function render(t,instant=false){
  state.t=clamp(t,0,duration);t=state.t;
  const c=currentChapter(t),local=sceneLocal(t,c.id);
  cinema.classList.toggle('instant',instant);
  state.scene=c.id;
  // Every opacity is calculated from film time. Outgoing details remain intact,
  // and a pause or seek preserves the same frame as normal playback.
  scenes.forEach(sc=>{
   const sl=sceneLocal(t,sc.id),enter=sc.id==='execution'?1:reveal(t-sc.start,sc.id==='end'?.4:sc.id==='duplicate'?.25:sc.id==='phone'?.24:.38);
   // Clear the outgoing title before introducing the next. Cross-dissolving
   // two large headlines at the same position creates a muddy double image.
   const leave=reduced?(t<sc.next?1:0):1-reveal(t-(sc.next-.18),.18),alpha=enter*leave;
   sc.el.style.opacity=alpha;sc.el.style.visibility=alpha>0?'visible':'hidden';sc.el.style.transform='none';
   sc.el.classList.toggle('active',sc.id===c.id);
   sc.el.setAttribute('aria-hidden',sc.id===c.id?'false':'true');
   sc.cues.forEach(el=>{
    const p=reveal(sl-Number(el.dataset.cue),sc.id==='end'?.6:el.dataset.motion==='fade'?.55:.42);
    el.style.opacity=p;el.style.transform=el.dataset.motion==='fade'?'none':`translateY(${(1-ease(p))*6}px)`;
    el.setAttribute('aria-hidden',String(p===0));
   });
  });
  const endChrome=1-reveal(sceneLocal(t,'end'),.5);
  $('.film-top').style.opacity=endChrome;$('.film-baseline').style.opacity=endChrome;
  $('.film-top').setAttribute('aria-hidden',String(endChrome<.1));$('.film-baseline').setAttribute('aria-hidden',String(endChrome<.1));
  txt('#chapter-label',`${String(c.index).padStart(2,'0')} / ${c.label}`);
  txt('#scene-location',({execution:'Your Mac → your broker',stop:'Stop placed → broker read-back',accounts:'Separate sizes · separate limits',duplicate:'Same signal · no extra position',phone:'Your phone → your Mac',close:'Your setting → confirmed flat',end:'Local execution. Your control.'})[c.id]);
  $$('.chapters button').forEach(b=>{const on=b.dataset.chapter===c.id;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'step':'false')});
  const x=sceneLocal(t,'execution');
  $('#chart-surface').style.setProperty('--chart-draw',1-ease(x/1.05));
  $('#chart-surface').style.setProperty('--chart-fill',reveal(x-1.0,.4));
  $('.transfer').style.setProperty('--transfer',`${smooth((x-1.35)/.55)*100}%`);
  $('.transfer').style.setProperty('--chart-fill',reveal(x-1.3,.2));
  const s=sceneLocal(t,'stop');txt('#stop-status',s>=5.4?'Broker confirmed':'Waiting for confirmation');$('#stop-status').style.color=s>=5.4?'var(--green)':'';
  $$('#stop .state-line').forEach((el,i)=>el.style.setProperty('--line-progress',reveal(s-(i?2.8:1.15),i?2.45:1.3)));
  const a=sceneLocal(t,'accounts');$('.routing-lines').style.setProperty('--branch-draw',1-ease((a-.2)/1.2));
  if(t>=chapters.find(ch=>ch.id==='phone').start && t<chapters.find(ch=>ch.id==='close').start+.46)paintChat(sceneLocal(t,'phone'));
  const cl=sceneLocal(t,'close');
  $('.session-track').style.setProperty('--session-progress',reduced?(cl>=4.1?1:0):smooth((cl-.85)/3.25));
  const closed=cl>=5.5,closing=cl>=4.1;
  $('#schedule-state').classList.toggle('closing',closing&&!closed);$('#schedule-state').classList.toggle('confirmed',closed);
  txt('#schedule-state span',closed?'Confirmed':closing?'Closing':'Scheduled');
  $('#settlement-a .settlement-value').style.setProperty('--settled',reveal(cl-4.7,.55));
  $('#settlement-b .settlement-value').style.setProperty('--settled',reveal(cl-4.95,.55));
  ['a','b'].forEach((id,i)=>{const done=cl>=4.7+i*.25+.275;$('#settlement-'+id+' .before').setAttribute('aria-hidden',String(done));$('#settlement-'+id+' .after').setAttribute('aria-hidden',String(!done))});
  if(state.cc){const seg=captions.find(s=>t>=s.start&&t<s.end);txt('#subtitle',seg?seg.text:'');$('#subtitle').hidden=!seg}else $('#subtitle').hidden=true;
  $('#scrub').value=t;$('#scrub').style.setProperty('--progress',`${100*t/duration}%`);$('#scrub').setAttribute('aria-valuetext',`${fmt(t)} of ${fmt(duration)}`);txt('#timecode',`${fmt(t)} / ${fmt(duration)}`);
 }
 function controls(){txt('#play',state.playing?'Ⅱ Pause':state.ended?'▶ Replay':'▶ Play film');$('#play').setAttribute('aria-label',state.playing?'Pause film':state.ended?'Replay film':'Play film');txt('#sound',state.sound?'Sound on':'Sound off');$('#sound').setAttribute('aria-label',state.sound?'Mute film':'Turn sound on');$('#captions').setAttribute('aria-pressed',String(state.cc));}
 function pause(){state.playing=false;audio.pause();cancelAnimationFrame(state.raf);controls()}
 function seek(t){const playing=state.playing;audio.currentTime=clamp(t,0,duration);state.start=clamp(t,0,duration);state.wall=performance.now();state.chatKey='';state.ended=t>=duration;render(t,true);requestAnimationFrame(()=>cinema.classList.remove('instant'));if(playing){state.playing=true;audio.play().catch(()=>{state.sound=false;audio.muted=true;controls()})}controls()}
 function tick(now){if(!state.playing)return;const t=!audio.paused&&audio.readyState>=2?audio.currentTime:state.start+(now-state.wall)/1000;render(t);if(t>=duration-.025){render(duration);state.ended=true;pause();return}state.raf=requestAnimationFrame(tick)}
 async function play(){if(state.t>=duration-.1)seek(0);state.start=state.t;state.wall=performance.now();audio.currentTime=state.t;audio.muted=!state.sound;state.playing=true;state.ended=false;try{await audio.play()}catch(e){state.sound=false;audio.muted=true}controls();cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(tick)}
 function manualPlay(){if(!state.soundChosen){state.sound=true;state.soundChosen=true}play()}
 $('#play').addEventListener('click',()=>state.playing?pause():manualPlay());$('#replay').addEventListener('click',()=>{seek(0);manualPlay()});
 $('#sound').addEventListener('click',()=>{state.soundChosen=true;state.sound=!state.sound;audio.muted=!state.sound;if(!state.playing&&state.sound)play();controls()});
 $('#captions').addEventListener('click',()=>{state.cc=!state.cc;render(state.t,true);controls()});
 $('#scrub').max=duration;$('#scrub').addEventListener('input',e=>seek(Number(e.target.value)));
 $$('.chapters button').forEach(b=>b.addEventListener('click',()=>{seek(chapters.find(c=>c.id===b.dataset.chapter).start);play()}));
 $('#fullscreen').addEventListener('click',async()=>{if(document.fullscreenElement)await document.exitFullscreen();else if(cinema.requestFullscreen){await cinema.requestFullscreen();cinema.focus({preventScroll:true})}});
 cinema.addEventListener('keydown',e=>{if(e.target.matches('input,button,a'))return;if(e.code==='Space'){e.preventDefault();state.playing?pause():manualPlay()}else if(e.key==='ArrowRight'){e.preventDefault();seek(state.t+5)}else if(e.key==='ArrowLeft'){e.preventDefault();seek(state.t-5)}else if(e.key.toLowerCase()==='m')$('#sound').click()});
 audio.addEventListener('ended',()=>{state.ended=true;render(duration);pause()});
 audio.addEventListener('error',()=>{state.sound=false;txt('#sound','Audio unavailable');console.warn('Film audio error:',audio.error?.code,audio.error?.message);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing)pause()});
 window.addEventListener('resize',()=>{state.chatKey='';render(state.t,true)});
 const q=new URLSearchParams(location.search),requestedTime=Number(q.get('at')||0),at=Number.isFinite(requestedTime)?requestedTime:0;render(at,true);controls();
 // Start on a deliberate opening frame. The first Play gesture enables voice;
 // an explicit mute remains respected on subsequent plays and replays.
 // Read-only state is useful for manual inspection without touching production.
 window.filmPreview={seek,pause,play,getState:()=>({time:state.t,scene:state.scene,playing:state.playing,duration})};
})();
