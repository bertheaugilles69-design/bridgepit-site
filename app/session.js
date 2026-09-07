/* Drive the untouched product renderers with a repeatable example session. */
let CURRENT=BridgePitExample.snapshot('dashboard',0);
j=async function(path,options){
  if(options&&options.method&&options.method!=='GET')throw new Error('Read-only example');
  const p=String(path).split('?')[0];
  const routes={
    '/api/status':CURRENT.status,'/api/strategies':CURRENT.strategies,'/api/events':CURRENT.events,
    '/api/instruments':[{symbol:'MNQ1!',contract:'MNQU6',exchange:'CME',point_value:2,tick_size:.25}],
    '/api/webhook_token':{token:'EXAMPLE_NOT_A_CREDENTIAL'},'/api/accounts':{accounts:CURRENT.accounts,connected:true,configured:true},
    '/api/worlds':{worlds:CURRENT.worlds},'/api/billing':CURRENT.billing,
    '/api/equity':CURRENT.equity,'/api/trades':CURRENT.trades,
    '/api/setup':{done:true,dismissed:false,steps:[]},'/api/listen':{port:8787}
  };
  if(!(p in routes))throw new Error('No example for '+p);
  return structuredClone(routes[p]);
};
let LAST_KEY='',CURRENT_VIEW='',LAST_TARGET='';
function sceneScroll(scene,time,immediate){
  const id=scene==='execution'?'actSec':scene==='limits'?(time<3?'w_funded_rowDaily':time<6?'w_funded_rowTrail':'w_funded_rowEod'):null;
  // New log rows increase the document's scroll range. Reframe when they
  // arrive, including when the initial empty log could not scroll this far.
  const target=scene+':'+id+(scene==='execution'?':'+CURRENT.events.length:'');
  if(target===LAST_TARGET&&!immediate)return;
  LAST_TARGET=target;
  let y=0;
  if(id){const el=document.getElementById(id);if(el)y=el.getBoundingClientRect().top+scrollY-(scene==='execution'?180:210);}
  window.scrollTo({top:Math.max(0,y),behavior:immediate?'instant':'smooth'});
}
async function draw(scene,time,playing,immediate){
  const next=BridgePitExample.snapshot(scene,time);
  const key=JSON.stringify([scene,next.accounts,next.events]);
  document.body.dataset.still=playing?'false':'true';
  if(key!==LAST_KEY){
    LAST_KEY=key;CURRENT=next;
    ACCTS=structuredClone(CURRENT.accounts);STRATS=structuredClone(CURRENT.strategies);EQ=structuredClone(CURRENT.equity);
    TRADES=structuredClone(CURRENT.trades);TRADES.strategies=aggTrips(TRADES.trips);BILL=CURRENT.billing;
    ACCTS_CONN=true;ACCTS_CONFIGURED=true;ACCTS_TS=Date.now();WEEK_CLOSED=false;SETUP={done:true};
    // Select the account using the product's own filter while following its log.
    SEL=scene==='execution'?BridgePitExample.accountIds[0]:'__all';
    renderSeg();renderAccounts();renderPerf();renderBlotter();renderStrategyCards();
    WORLDS=structuredClone(CURRENT.worlds);renderWorld('funded');renderWorld('own');
    renderBilling();await refresh();
    CONNS=[{broker:'rithmic',status:'connected'}];renderRithmicAttrib();
    const nextView=scene==='limits'?'funded':'dashboard';
    if(CURRENT_VIEW!==nextView){go(nextView);CURRENT_VIEW=nextView;}
    document.querySelector('.app').inert=true;
  }
  sceneScroll(scene,time,immediate);
  parent.postMessage({type:'bridgepit:state',scene,time,errors:window.__showcaseErrors,
    status:document.getElementById('topStatusText').textContent,
    accountTexts:[...document.querySelectorAll('#acctCards .pnl')].map(e=>e.textContent),
    logRows:document.querySelectorAll('#logBody tr').length},location.origin);
}
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='bridgepit:seek')return;
  draw(e.data.scene,e.data.time,!!e.data.playing,!!e.data.immediate).catch(err=>{
    window.__showcaseErrors.push(String(err));parent.postMessage({type:'bridgepit:error',error:String(err)},location.origin);
  });
});
(async()=>{await draw('dashboard',0,false,true);await document.fonts.ready;parent.postMessage({type:'bridgepit:ready'},location.origin);})();
