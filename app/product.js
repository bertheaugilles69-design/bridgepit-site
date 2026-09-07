
// icons
const ICONS={
 ICON_HOME:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>',
 ICON_LINK:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5a4 4 0 00-5.7 0l-3 3a4 4 0 105.7 5.7l1.5-1.5m-1.5-6a4 4 0 015.7 0l3-3a4 4 0 10-5.7-5.7L15 4.5"/></svg>',
 ICON_CHART:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 20V10M10 20V4M16 20v-6M22 20H2"/></svg>',
 ICON_CARD:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
 ICON_GEAR:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" d="M19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 2h-5l-.3 2.6a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.3 2.4h5l.3-2.6a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6a7 7 0 00.1-1z"/></svg>',
 ICON_HOUSE:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 10l8-6 8 6v10H4z"/><path stroke-linecap="round" d="M10 20v-5h4v5"/></svg>',
 ICON_SHIELD:'<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l8 3v6c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V6z"/></svg>',
 LI:'<li><svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
};
document.body.innerHTML=document.body.innerHTML.replace(/\$\{(\w+)\}/g,(m,k)=>ICONS[k]||m);

// nav / routing
const titles={dashboard:'Dashboard',connections:'Connections',strategies:'Strategies',funded:'Funded accounts',own:'My brokerage',subscription:'Subscription',settings:'Settings'};
function go(v){
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('active',s.id===v));
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.view===v));
  document.getElementById('pageTitle').textContent=titles[v]||v;
}
document.getElementById('nav').addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.dataset.view)go(a.dataset.view)});
document.getElementById('nav').addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const a=e.target.closest('a'); if(!a||!a.dataset.view)return;
  e.preventDefault(); go(a.dataset.view);
});


// ---- the two worlds: funded accounts and your own brokerage account
// One page each, one save each. There is no shared field left for a control
// to rewrite - which is the whole fix. The app-wide funded/own switch that
// used to live in Settings turned a live evening close off by accident.
let WORLDS={};

async function loadWorlds(){
  let d;
  try{d=await j('/api/worlds')}catch(e){return}
  WORLDS=d.worlds||{};
  for(const w of ['funded','own'])renderWorld(w);
  tgInit();
}

function renderWorld(w){
  const v=WORLDS[w]; if(!v)return;
  const el=id=>document.getElementById('w_'+w+'_'+id);
  const r=v.rules||{};
  // Never paint over a value the operator is in the middle of typing. The
  // control this replaces did exactly that, and cost him a whole day of
  // failsafe: a re-render wrote the default back over his 500.
  const busy=id=>document.activeElement===el(id);
  if(!busy('daily'))el('daily').value=r.daily_stop_usd??'';
  if(!busy('trail'))el('trail').value=r.floor_buffer_usd??'';
  if(!busy('eodTime'))el('eodTime').value=(r.eod&&r.eod.time_et)||'15:55';
  el('eodOn').checked=!!(r.eod&&r.eod.enabled);
  const seg=el('scopeSeg');
  if(seg)seg.querySelectorAll('button').forEach(b=>
    b.classList.toggle('on',b.dataset.scope===(r.halt_scope||'all')));
  const n=(v.accounts||[]).length;
  el('count').textContent=n?(n===1?'1 account':n+' accounts'):'';
  // The scope choice only means something once a second account is in this
  // world - with one, both answers do the same thing.
  const sw=document.getElementById('scopeWrap');
  if(w==='funded'&&sw)sw.style.display=(n>=2)?'':'none';
  el('conns').innerHTML=worldConnsHtml(v);
  worldPaint(w);
}

// The list is a statement of what this page governs, not a control. An empty
// world says so plainly instead of rendering a blank card that reads broken.
function worldConnsHtml(v){
  const conns=v.connections||[], accts=v.accounts||[];
  if(!conns.length&&!accts.length){
    return `<div class="muted" style="font-size:13.5px;line-height:1.6">No broker login is in this world yet, so nothing on this page is doing anything. `
      +(v.world==='own'
        ?`A personal broker login belongs here - set it on its Connections card.`
        :`Every login starts here, because limits on is the safe guess.`)+`</div>`;
  }
  const byConn={};
  accts.forEach(a=>{(byConn[a.connection||'']=byConn[a.connection||'']||[]).push(a)});
  const blocks=conns.map(c=>{
    const mine=byConn[c.label]||[];
    delete byConn[c.label];
    return `<div class="wconn">
      <div class="wconn-head"><div><b>${esc(c.label)}</b><div class="wconn-sub">${esc(c.broker)} · ${mine.length?(mine.length===1?'1 account':mine.length+' accounts'):'no account seen yet'}</div></div>
        <span class="pill ${c.status==='connected'?'ok':'warn'}"><span class="dot"></span>${esc(c.status||'disconnected')}</span></div>
      ${mine.map(acctRow).join('')||'<div class="hint" style="padding:12px 0">Its accounts appear here once this login connects. They already follow this page.</div>'}
    </div>`}).join('');
  // Accounts we know about whose login is gone - they still follow this page,
  // and hiding them would understate what these limits reach.
  const orphans=Object.values(byConn).flat();
  return blocks+(orphans.length?`<div class="wconn"><div class="wconn-head"><div><b>No connection</b><div class="wconn-sub">seen before, its login is not saved any more</div></div></div>${orphans.map(acctRow).join('')}</div>`:'');
}

function acctRow(a){
  return `<div class="wrow">
    <div class="wrow-id"><div class="wrow-nm">${esc(a.label||a.id)}</div><div class="wrow-sub">${esc(a.id)}</div></div>
    <div class="wrow-num">${a.own_numbers?'has numbers of its own':'uses the numbers below'}</div>
    <button class="btn btn-xs" onclick="openAcct('${esc(a.id)}')">Its own limits</button>
  </div>`;
}

// Presentation only: each protection says whether it is actually guarding
// anything. An empty box means off - that was true before and invisible.
function worldPaint(w){
  const el=id=>document.getElementById('w_'+w+'_'+id);
  const lit=(row,on)=>{const e=document.getElementById('w_'+w+'_'+row);
    if(!e)return; e.classList.toggle('on',!!on);
    const d=e.querySelector('.grd-dot'); if(d)d.classList.toggle('on',!!on)};
  const has=id=>{const e=el(id);return e&&String(e.value).trim()!==''&&Number(e.value)>0};
  lit('rowDaily',has('daily'));
  lit('rowTrail',has('trail'));
  const on=el('eodOn')&&el('eodOn').checked;
  lit('rowEod',on);
  const t=el('eodTime'); if(t){t.disabled=!on;t.style.opacity=on?'1':'.45'}
}

async function setWorldScope(w,sc){
  try{
    const r=await fetch('/api/worlds',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({world:w,halt_scope:sc})});
    const d=await r.json();
    if(r.ok)showWarn(d.warnings,w);
    await loadWorlds();
  }catch(e){}
}

function showWarn(list,w){
  const el=document.getElementById('w_'+w+'_warn');
  if(!el)return;
  if(!list||!list.length){el.style.display='none';el.innerHTML='';return}
  // Warnings are the whole point of the "any value, told the truth" rule -
  // they must be impossible to miss, and must never look like an error.
  el.style.display='block';
  el.innerHTML=list.map(t=>`<div class="card" style="background:rgba(245,166,35,.07);border-color:rgba(245,166,35,.35);margin:0 0 8px;padding:12px 14px;font-size:13px">⚠︎ ${esc(t)}</div>`).join('');
}

async function saveWorld(w){
  const el=id=>document.getElementById('w_'+w+'_'+id);
  const err=el('err');err.style.display='none';
  const btn=el('save');btn.disabled=true;
  const body={world:w,
              daily_stop_usd:el('daily').value.trim(),
              floor_buffer_usd:el('trail').value.trim(),
              eod_time_et:el('eodTime').value.trim(),
              eod_enabled:el('eodOn').checked};
  try{
    const r=await fetch('/api/worlds',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok){err.style.display='block';err.textContent=d.error||'Could not save.';btn.disabled=false;return}
    showWarn(d.warnings,w);
    const s=el('saved');
    s.innerHTML='<span class="tick"></span>In effect now - no restart needed.';
    s.classList.add('show');
    clearTimeout(window['_wSavedT_'+w]);
    window['_wSavedT_'+w]=setTimeout(()=>s.classList.remove('show'),4200);
    await loadWorlds();refresh();
  }catch(e){err.style.display='block';err.textContent='Could not reach BridgePit.'}
  btn.disabled=false;
}

// ---- local port. Never moved automatically: a port that changed by itself
// would silently stop every inbound alert, since the tunnel points at one.
async function loadPort(){
  try{const d=await j('/api/listen');document.getElementById('lPort').value=d.port||''}catch(e){}
}
async function savePort(){
  const msg=document.getElementById('lMsg');msg.style.color='';msg.textContent='';
  try{
    const r=await fetch('/api/listen',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({port:document.getElementById('lPort').value})});
    const d=await r.json();
    if(!r.ok){msg.style.color='var(--red)';msg.textContent=d.error||'Could not save.';return}
    msg.textContent=d.warnings&&d.warnings.length?d.warnings.join(' '):'Saved.';
  }catch(e){msg.style.color='var(--red)';msg.textContent='Could not reach BridgePit.'}
}

// ---- notifications: how the customer hears about trouble when he is away.
// Secrets are never sent back to the page, so the boxes stay blank and blank
// means "keep what is saved" - otherwise every small edit would demand the
// token again, and people paste tokens into the wrong field when nagged.
async function loadNotify(){
  let n;
  try{n=await j('/api/notify')}catch(e){return}
  document.getElementById('nTgOn').checked=n.telegram.enabled;
  document.getElementById('nTgChat').value=n.telegram.chat_id||'';
  document.getElementById('nTgToken').placeholder=n.telegram.token_set?'saved - leave blank to keep it':'paste the token from BotFather';
  document.getElementById('nEmOn').checked=n.email.enabled;
  document.getElementById('nEmTo').value=n.email.to||'';
  document.getElementById('nEmUser').value=n.email.user||'';
  document.getElementById('nEmHost').value=n.email.smtp_host||'';
  document.getElementById('nEmPort').value=n.email.smtp_port||'';
  document.getElementById('nEmPass').placeholder=n.email.password_set?'saved - leave blank to keep it':'app password';
  document.getElementById('nTrades').checked=n.trades_too;
}

async function saveNotify(){
  const err=document.getElementById('nErr');err.style.display='none';
  const btn=document.getElementById('nSave');btn.disabled=true;
  const body={trades_too:document.getElementById('nTrades').checked,
    telegram:{enabled:document.getElementById('nTgOn').checked,
              chat_id:document.getElementById('nTgChat').value.trim(),
              token:document.getElementById('nTgToken').value},
    email:{enabled:document.getElementById('nEmOn').checked,
           to:document.getElementById('nEmTo').value.trim(),
           user:document.getElementById('nEmUser').value.trim(),
           smtp_host:document.getElementById('nEmHost').value.trim(),
           smtp_port:document.getElementById('nEmPort').value,
           password:document.getElementById('nEmPass').value}};
  try{
    const r=await fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok){err.style.display='block';err.textContent=d.error||'Could not save.';btn.disabled=false;return}
    document.getElementById('nTgToken').value='';document.getElementById('nEmPass').value='';
    const s=document.getElementById('nSaved');s.textContent='Saved. Now send a test below and confirm it arrived.';
    setTimeout(()=>{s.textContent=''},8000);
    await loadNotify();loadAlerting();loadDeps();
  }catch(e){err.style.display='block';err.textContent='Could not reach BridgePit.'}
  btn.disabled=false;
}

// ---- alert setup: the block, with the real token already in it.
// Typing a token by hand is where setups die silently: a wrong token is a 403
// the customer never sees, because TradingView reports a delivered webhook.
// ==== alert block (tested by test_alert_block_mask.js - do not rename the markers) ====
// The token is the credential that lets anything place orders on this machine.
// It used to be printed in clear text in the block below - and this is the one
// screen a customer photographs when asking for help, so the first person who
// looked at a screenshot of it read the token straight off (2026-08-13, from a
// demo instance). The dashboard already masks the same secret behind Reveal;
// this screen now follows the same rule. Copy still copies the REAL block,
// because "nothing to type" is the whole point of the feature.
let AB_TOKEN=null, AB_SHOWN=false;
const AB_MASK='•'.repeat(22);

async function loadAlertBlock(){
  const sel=document.getElementById('abStrat');
  if(!sel)return;
  // keep the customer's selection across the 2s refresh: rebuilding the list
  // snapped it back to the FIRST strategy, and Copy block then put the wrong
  // strategy_name on the clipboard - pasted into TradingView, every alert of
  // that strategy would trade the wrong instrument and size
  const cur=sel.value;
  sel.innerHTML=STRATS.length?STRATS.map(s=>`<option value="${esc(s.name)}">${esc(s.name)} · ${esc(s.symbol)}</option>`).join('')
    :`<option value="">add a strategy first</option>`;
  if(cur&&STRATS.some(s=>s.name===cur))sel.value=cur;
  if(AB_TOKEN===null){
    try{AB_TOKEN=(await j('/api/webhook_token')).token||''}catch(e){AB_TOKEN=''}
  }
  renderAlertBlock();
}

// masked=true renders the dots; the real token is only ever produced for the
// clipboard, never written into the page.
function alertBlockText(name, masked){
  const tok = masked ? AB_MASK : (AB_TOKEN||'YOUR-TOKEN');
  return `{
  "strategy_name": "${name}",
  "data": "{{strategy.order.action}}",
  "quantity": "{{strategy.order.contracts}}",
  "price": "{{close}}",
  "bar_time": "{{time}}",
  "fired_at": "{{timenow}}",
  "token": "${tok}"
}`;
}

function renderAlertBlock(){
  const name=document.getElementById('abStrat').value;
  const pre=document.getElementById('abBlock');
  const btn=document.getElementById('abReveal');
  if(!name){
    pre.textContent='Add a strategy first - the block needs its name.';
    if(btn)btn.style.visibility='hidden';
    return;
  }
  if(btn){btn.style.visibility='visible';btn.textContent=AB_SHOWN?'Hide token':'Show token'}
  pre.textContent=alertBlockText(name, !AB_SHOWN);
}

function toggleAlertToken(){
  AB_SHOWN=!AB_SHOWN;
  renderAlertBlock();
}

async function copyAlertBlock(){
  const name=document.getElementById('abStrat').value;
  if(!name)return;
  try{
    // always the real block - what is on screen may be masked
    await navigator.clipboard.writeText(alertBlockText(name, false));
    const b=document.getElementById('abCopy');const t=b.textContent;b.textContent='Copied';
    setTimeout(()=>{b.textContent=t},1500);
  }catch(e){}
}
// ==== end alert block ====

async function fireAlertTest(){
  const name=document.getElementById('abStrat').value;
  const out=document.getElementById('abResult');
  if(!name){out.textContent='Add a strategy first.';return}
  const btn=document.getElementById('abTest');btn.disabled=true;
  out.style.color='';out.textContent='sending…';
  try{
    const r=await fetch('/api/alert_test',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({strategy_name:name})});
    const d=await r.json();
    if(!r.ok){out.style.color='var(--red)';out.textContent=d.error||'Test failed.'}
    else{out.style.color='var(--green)';out.textContent=d.message}
    refresh();
  }catch(e){out.style.color='var(--red)';out.textContent='Could not reach BridgePit.'}
  btn.disabled=false;
}

// ---- instruments: what may be traded at all. The strategy form's error tells
// the customer to add one here, so this screen has to exist or he is stuck.
const EXCHANGES=['CME','COMEX','NYMEX','CBOT','ICE','EUREX'];
let INSTS=[], IEDIT=null;

async function loadInsts(){
  try{INSTS=await j('/api/instruments')}catch(e){return}
  document.getElementById('instBody').innerHTML=INSTS.length?INSTS.map(i=>
    `<tr><td class="mono" style="font-weight:550">${esc(i.symbol)}</td><td class="mono">${esc(i.root||'')}</td><td>${esc(i.exchange||'')}</td>`
    +`<td style="text-align:right"><button class="btn btn-ghost" style="padding:4px 10px;font-size:13px" onclick="openInst('${esc(i.symbol)}')">Edit</button></td></tr>`).join('')
    :`<tr><td colspan="4" class="muted" style="text-align:center;padding:24px">Nothing yet. Add the instruments you trade.</td></tr>`;
}

function iErr(m){const e=document.getElementById('iErr');e.style.display=m?'block':'none';e.textContent=m||''}

function openInst(sym){
  IEDIT=sym||null; iErr('');
  const i=sym?INSTS.find(x=>x.symbol===sym):null;
  document.getElementById('iSearch').value='';
  const sg=document.getElementById('iSuggest');sg.style.display='none';sg.innerHTML='';
  document.getElementById('instTitle').textContent=i?'Edit instrument':'Add instrument';
  document.getElementById('iExch').innerHTML=EXCHANGES.map(e=>`<option value="${e}">${e}</option>`).join('');
  document.getElementById('iSymbol').value=i?i.symbol:'';
  document.getElementById('iRoot').value=i?(i.root||''):'';
  if(i&&i.exchange)document.getElementById('iExch').value=i.exchange;
  document.getElementById('iDelete').style.display=i?'inline-flex':'none';
  document.getElementById('instBg').classList.add('show');
  setTimeout(()=>document.getElementById('iSymbol').focus(),50);
}
function closeInst(){document.getElementById('instBg').classList.remove('show')}

// The liquid CME-group set nearly every customer trades. Picking fills the
// three fields below - checked, not typed (part 3, #2). Exotics stay typable.
const INST_CATALOG=[
 {s:'MNQ1!',r:'MNQ',e:'CME',n:'Micro Nasdaq-100'},
 {s:'NQ1!',r:'NQ',e:'CME',n:'E-mini Nasdaq-100'},
 {s:'MES1!',r:'MES',e:'CME',n:'Micro S&P 500'},
 {s:'ES1!',r:'ES',e:'CME',n:'E-mini S&P 500'},
 {s:'MYM1!',r:'MYM',e:'CBOT',n:'Micro Dow'},
 {s:'YM1!',r:'YM',e:'CBOT',n:'E-mini Dow'},
 {s:'M2K1!',r:'M2K',e:'CME',n:'Micro Russell 2000'},
 {s:'RTY1!',r:'RTY',e:'CME',n:'E-mini Russell 2000'},
 {s:'MGC1!',r:'MGC',e:'COMEX',n:'Micro Gold'},
 {s:'GC1!',r:'GC',e:'COMEX',n:'Gold'},
 {s:'SIL1!',r:'SIL',e:'COMEX',n:'Micro Silver'},
 {s:'SI1!',r:'SI',e:'COMEX',n:'Silver'},
 {s:'MHG1!',r:'MHG',e:'COMEX',n:'Micro Copper'},
 {s:'HG1!',r:'HG',e:'COMEX',n:'Copper'},
 {s:'MCL1!',r:'MCL',e:'NYMEX',n:'Micro Crude Oil'},
 {s:'CL1!',r:'CL',e:'NYMEX',n:'Crude Oil'},
 {s:'NG1!',r:'NG',e:'NYMEX',n:'Natural Gas'},
 {s:'MBT1!',r:'MBT',e:'CME',n:'Micro Bitcoin'},
 {s:'BTC1!',r:'BTC',e:'CME',n:'Bitcoin'},
 {s:'MET1!',r:'MET',e:'CME',n:'Micro Ether'},
 {s:'ETH1!',r:'ETH',e:'CME',n:'Ether'},
 {s:'ZB1!',r:'ZB',e:'CBOT',n:'30-Year T-Bond'},
 {s:'ZN1!',r:'ZN',e:'CBOT',n:'10-Year T-Note'},
 {s:'ZF1!',r:'ZF',e:'CBOT',n:'5-Year T-Note'},
 {s:'ZT1!',r:'ZT',e:'CBOT',n:'2-Year T-Note'},
 {s:'6E1!',r:'6E',e:'CME',n:'Euro FX'},
 {s:'6B1!',r:'6B',e:'CME',n:'British Pound'},
 {s:'6J1!',r:'6J',e:'CME',n:'Japanese Yen'},
 {s:'ZC1!',r:'ZC',e:'CBOT',n:'Corn'},
 {s:'ZS1!',r:'ZS',e:'CBOT',n:'Soybeans'},
 {s:'ZW1!',r:'ZW',e:'CBOT',n:'Chicago Wheat'},
];
function instCatalogMatches(q){
  q=String(q||'').trim().toLowerCase();
  if(!q)return [];
  return INST_CATALOG.filter(i=>i.s.toLowerCase().includes(q)
    ||i.r.toLowerCase().includes(q)||i.n.toLowerCase().includes(q)).slice(0,8);
}
function instSuggest(){
  const box=document.getElementById('iSuggest');
  const m=instCatalogMatches(document.getElementById('iSearch').value);
  if(!m.length){box.style.display='none';box.innerHTML='';return}
  box.style.display='block';
  box.innerHTML=m.map((i,ix)=>`<div onclick="instPick(${ix})" style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--line2)"
    onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
    <b>${esc(i.n)}</b> <span class="muted">· ${esc(i.s)} · ${esc(i.r)} · ${esc(i.e)}</span></div>`).join('');
  box._matches=m;
}
function instPick(ix){
  const i=(document.getElementById('iSuggest')._matches||[])[ix];
  if(!i)return;
  document.getElementById('iSymbol').value=i.s;
  document.getElementById('iRoot').value=i.r;
  document.getElementById('iExch').value=i.e;
  document.getElementById('iSearch').value=i.n;
  const box=document.getElementById('iSuggest');box.style.display='none';box.innerHTML='';
}

// Visible confirmation on save: the row that was just created appears,
// highlights, settles - same treatment the dashboard test fill already
// has (part 3, #3). Certainty, not hope.
function flashRowByText(tbodyId,text){
  const row=[...document.querySelectorAll('#'+tbodyId+' tr')]
    .find(x=>((x.cells&&x.cells[0]?x.cells[0].textContent:'')||'').trim().startsWith(text));
  if(!row)return;
  row.classList.add('flashrow');
  setTimeout(()=>row.classList.remove('flashrow'),2600);
}

// ---- the public-address walkthrough (part 3, #1). Each step proven.
function tgNote(el,msg,good){
  const n=document.getElementById(el);
  n.style.display='block';n.style.color=good?'var(--green)':'var(--red)';n.textContent=msg;
}
async function tgInit(){
  document.getElementById('tgCmd').value='tailscale funnel --bg '+(location.port||'8787');
  try{
    const s=await j('/api/status');
    const u=s&&s.webhook_url;
    if(u&&!u.includes('127.0.0.1'))document.getElementById('tgUrl').value=u;
  }catch(e){}
}
async function tgSaveUrl(){
  try{
    const r=await fetch('/api/tunnel/url',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({url:document.getElementById('tgUrl').value.trim()})});
    const d=await r.json();
    if(!r.ok){tgNote('tgUrlNote',d.error||'Could not save.',false);return}
    if(d.url){document.getElementById('tgUrl').value=d.url;
      tgNote('tgUrlNote','Saved - this is now the webhook address in Alert setup above.',true)}
    else tgNote('tgUrlNote','Cleared.',true);
    loadAlertBlock();refresh();
  }catch(e){tgNote('tgUrlNote','Could not reach BridgePit.',false)}
}
async function tgCheckPath(){
  const b=document.getElementById('tgCheck');b.disabled=true;
  tgNote('tgResult','Checking - the probe goes out to the internet and back…',true);
  try{
    const r=await fetch('/api/tunnel/check',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    const d=await r.json();
    tgNote('tgResult',(d.reachable?'✓ ':'✕ ')+(d.detail||''),!!d.reachable);
  }catch(e){tgNote('tgResult','Could not reach BridgePit.',false)}
  b.disabled=false;
}
async function tgTestAlert(){
  const b=document.getElementById('tgTest');b.disabled=true;
  tgNote('tgResult','Sending the test alert the long way round…',true);
  const name=(STRATS.find(s=>s.enabled)||STRATS[0]||{}).name||'My_First_Strategy';
  try{
    const r=await fetch('/api/tunnel/testalert',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({strategy_name:name})});
    const d=await r.json();
    if(d.ok){tgNote('tgResult','✓ '+d.message,true);refresh()}
    else tgNote('tgResult','✕ '+(d.error||'Did not complete.'),false);
  }catch(e){tgNote('tgResult','Could not reach BridgePit.',false)}
  b.disabled=false;
}

async function saveInst(){
  iErr(''); const btn=document.getElementById('iSubmit'); btn.disabled=true;
  const body={symbol:document.getElementById('iSymbol').value.trim(),
              root:document.getElementById('iRoot').value.trim(),
              exchange:document.getElementById('iExch').value};
  try{
    const r=await fetch('/api/instruments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok){iErr(d.error||'Could not save.');btn.disabled=false;return}
    closeInst();await loadInsts();
    flashRowByText('instBody',body.symbol);   // certainty, not hope (part 3, #3)
  }catch(e){iErr('Could not reach BridgePit.')}
  btn.disabled=false;
}

async function deleteInst(){
  if(!IEDIT)return; iErr('');
  try{
    const r=await fetch(`/api/instruments/${encodeURIComponent(IEDIT)}/delete`,{method:'POST'});
    const d=await r.json();
    if(!r.ok){iErr(d.error||'Could not delete.');return}
    closeInst();await loadInsts();
  }catch(e){iErr('Could not reach BridgePit.')}
}

// Close ONE strategy - on EVERY account it runs on - leaving other strategies
// open. The alternative people reach for is closing by hand at the broker,
// which leaves our book stale and makes that strategy's own exit alert open
// the opposite position later.
async function closeStrat(name){
  const s=STRATS.find(x=>x.name===name)||{};
  const parts=[];
  if(s.position)parts.push(`${s.position>0?'+':''}${s.position} on ${s.account||'your execution account'}`);
  for(const l of (s.also_on||[]))if(l.position)parts.push(`${l.position>0?'+':''}${l.position} on ${l.account}`);
  if(!parts.length)return;
  if(!confirm(`Close ${name} everywhere it runs?\n\n${parts.join('\n')}\n\nOnly this strategy is closed. Other strategies stay open.`))return;
  try{
    const r=await fetch(`/api/strategies/${encodeURIComponent(name)}/close`,{method:'POST'});
    const d=await r.json();
    if(!r.ok)alert(d.error||'Could not close.');
    refresh();
  }catch(e){alert('Could not reach BridgePit.')}
}

// ---- strategies: add / edit / delete, all in the app (never a config file)
let EDITING=null;
function sErr(m){const e=document.getElementById('sErr');e.style.display=m?'block':'none';e.textContent=m||''}

// Extra accounts for one strategy. The customer made ONE strategy and writes ONE
// alert; the engine needs a book per account, so each row becomes a leg behind
// the scenes. He never sees or types those names - and he never types an
// account either: a typo'd id here silently routed real orders at the wrong
// place (stranger run part 2, #1). Everything but the name is picked or bounded.
let KNOWN_ACCTS=[],KNOWN_LABELS={};      // /api/accounts/known, loaded when the modal opens
let MODAL_PV={};         // symbol -> $ per point, from /api/instruments

// "32 points = $64 per contract" - the number a customer used to leave the
// app to look up, which is where he gave up. Pure so the test can hold it.
function stopUsdPreview(pts,pv,mult){
  const p=parseFloat(pts);
  if(!p||p<=0)return '';
  if(pv==null)return "We don't know this instrument's point value, so no dollar preview.";
  const per=p*pv,m=parseInt(mult)||1;
  const f=v=>'$'+v.toLocaleString('en-US',{maximumFractionDigits:0});
  return `${p.toLocaleString('en-US')} points = ${f(per)} per contract`+(m>1?` · ${f(per*m)} across your ${m} contracts`:'');
}
function stopUsdRefresh(){
  const pv=MODAL_PV[document.getElementById('sSymbol').value];
  const mult=document.getElementById('sMult').value;
  const line=document.getElementById('sStopUsd');
  const txt=stopUsdPreview(document.getElementById('sStop').value,pv,mult);
  line.style.display=txt?'block':'none';line.textContent=txt;
  document.querySelectorAll('#sAlso .alsoRow').forEach(r=>{
    // blank contracts on an extra line means "same size as the first account"
    r.querySelector('.aUsd').textContent=
      stopUsdPreview(r.querySelector('.aStop').value,pv,r.querySelector('.aMult').value||mult);
  });
}
function resolvedPrimary(){
  return document.getElementById('sAcct').value||(KNOWN_ACCTS.find(a=>a.default)||{}).id||'';
}
function fillAcctSelect(current){
  const dflt=KNOWN_ACCTS.find(a=>a.default);
  let opts=`<option value="">Your execution account${dflt?' - '+esc(dflt.label||dflt.id):''}</option>`;
  for(const a of KNOWN_ACCTS){
    if(a.default)continue;
    opts+=`<option value="${esc(a.id)}"${a.id===current?' selected':''}>${esc(a.label||a.id)}</option>`;
  }
  if(current&&!KNOWN_ACCTS.some(x=>x.id===current))
    opts+=`<option value="${esc(current)}" selected>${esc(KNOWN_LABELS[current]||current)} (not connected)</option>`;
  document.getElementById('sAcct').innerHTML=opts;
}
function alsoAcctOptions(selected){
  const primary=resolvedPrimary();
  let opts='<option value="">pick an account</option>',found=false;
  for(const a of KNOWN_ACCTS){
    if(a.id===primary)continue;
    const sel=a.id===selected?' selected':'';
    if(sel)found=true;
    opts+=`<option value="${esc(a.id)}"${sel}>${esc(a.label||a.id)}</option>`;
  }
  if(selected&&selected!==primary&&!found)
    opts+=`<option value="${esc(selected)}" selected>${esc(KNOWN_LABELS[selected]||selected)} (not connected)</option>`;
  return opts;
}
function renderAlsoAvail(){
  const others=KNOWN_ACCTS.filter(a=>a.id!==resolvedPrimary());
  const rows=document.querySelectorAll('#sAlso .alsoRow').length;
  document.getElementById('sAlsoNone').style.display=(others.length||rows)?'none':'block';
  document.getElementById('sAlsoAdd').style.display=others.length?'':'none';
}
function acctChanged(){
  document.querySelectorAll('#sAlso .alsoRow select.aAcct').forEach(s=>{
    s.innerHTML=alsoAcctOptions(s.value);
  });
  renderAlsoAvail();stopUsdRefresh();
}
function alsoRow(d){
  d=d||{};
  const w=document.createElement('div');
  w.className='alsoRow';
  w.style.cssText='display:grid;grid-template-columns:2fr 1fr 1fr auto auto;gap:8px;margin-top:10px;align-items:end';
  w.innerHTML=`<div><div class="flab">Account</div><select class="aAcct">${alsoAcctOptions(d.account||'')}</select></div>
    <div><div class="flab">Contracts</div><input class="aMult" type="number" min="1" max="100" step="1" placeholder="same" value="${d.multiplier!=null?d.multiplier:''}"></div>
    <div><div class="flab">Stop (points)</div><input class="aStop" type="number" min="0" max="2000" step="1" placeholder="none" value="${d.protective_stop_pts!=null?d.protective_stop_pts:''}"></div>
    <div style="text-align:center"><div class="flab">On</div><input class="aOn" type="checkbox"${d.enabled===false?'':' checked'} title="untick to pause this account without removing it" style="width:18px;height:18px;margin:6px 0"></div>
    <button class="btn btn-ghost" style="padding:5px 10px;font-size:13px;color:var(--red)" title="remove this account">✕</button>
    <div class="muted aUsd" style="grid-column:1/-1;font-size:12px"></div>`;
  w.querySelector('button').onclick=()=>{w.remove();renderAlsoAvail();stopUsdRefresh()};
  w.addEventListener('input',stopUsdRefresh);
  w.addEventListener('change',stopUsdRefresh);
  return w;
}
function addAlso(d){
  document.getElementById('sAlso').appendChild(alsoRow(d));
  renderAlsoAvail();stopUsdRefresh();
}
function readAlso(){
  return [...document.querySelectorAll('#sAlso .alsoRow')].map(r=>({
    account:r.querySelector('.aAcct').value.trim(),
    multiplier:r.querySelector('.aMult').value,
    protective_stop_pts:r.querySelector('.aStop').value,
    enabled:r.querySelector('.aOn').checked
  })).filter(x=>x.account||x.multiplier||x.protective_stop_pts);
}
async function openStrat(name){
  EDITING=name||null;
  sErr('');
  const sel=document.getElementById('sSymbol');
  let syms=[];
  try{syms=await j('/api/instruments')}catch(e){syms=[]}
  // fall back to whatever existing strategies already trade, so the picker is
  // never empty even if the instruments call fails
  if(!syms.length)syms=[...new Set(STRATS.map(s=>s.symbol))].map(s=>({symbol:s}));
  sel.innerHTML=syms.map(s=>`<option value="${esc(s.symbol)}">${esc(s.symbol)}${s.exchange?' · '+esc(s.exchange):''}</option>`).join('');
  MODAL_PV=Object.fromEntries(syms.map(x=>[x.symbol,x.point_value!=null?x.point_value:null]));
  try{const k=await j('/api/accounts/known');KNOWN_ACCTS=k.accounts||[];KNOWN_LABELS=k.labels||{}}catch(e){KNOWN_ACCTS=[];KNOWN_LABELS={}}

  const s=name?STRATS.find(x=>x.name===name):null;
  document.getElementById('stratTitle').textContent=s?'Edit strategy':'Add strategy';
  document.getElementById('sName').value=s?s.name:'';
  document.getElementById('sMult').value=s?s.multiplier:1;
  document.getElementById('sStop').value=s&&s.protective_stop_pts?s.protective_stop_pts:'';
  fillAcctSelect(s&&s.account?s.account:'');
  document.getElementById('sEnabled').checked=s?!!s.enabled:true;
  document.getElementById('sAlso').innerHTML='';
  ((s&&s.also_on)||[]).forEach(addAlso);
  if(s)sel.value=s.symbol;
  renderAlsoAvail();stopUsdRefresh();
  document.getElementById('sDelete').style.display=s?'inline-flex':'none';
  document.getElementById('stratBg').classList.add('show');
  setTimeout(()=>document.getElementById('sName').focus(),50);
}
// closeStratModal, NOT closeStrat: a second `function closeStrat()` here
// SHADOWED the position-closing closeStrat(name) above (declarations hoist,
// the later one wins) and the table's Close button silently did NOTHING -
// no confirm, no request, position left open on every account (2026-08-14).
function closeStratModal(){document.getElementById('stratBg').classList.remove('show')}

async function saveStrat(){
  sErr('');
  const btn=document.getElementById('sSubmit');btn.disabled=true;
  const nm=document.getElementById('sName').value.trim();
  // inline, before the round-trip: the one field that is genuinely typed
  if(!/^[A-Za-z0-9_.\-]{1,40}$/.test(nm)){
    sErr('Name must be 1-40 characters: letters, numbers, dot, dash or underscore - it has to match the strategy_name in your TradingView alert exactly.');
    btn.disabled=false;return}
  const body={name:document.getElementById('sName').value.trim(),
              symbol:document.getElementById('sSymbol').value,
              multiplier:document.getElementById('sMult').value,
              protective_stop_pts:document.getElementById('sStop').value,
              account:document.getElementById('sAcct').value.trim(),
              enabled:document.getElementById('sEnabled').checked,
              also_on:readAlso()};
  if(EDITING)body.rename_from=EDITING;
  try{
    const r=await fetch('/api/strategies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok){sErr(d.error||'Could not save.');btn.disabled=false;return}
    closeStratModal();await refresh();loadInsts();
    flashRowByText('stratBody',body.name);    // certainty, not hope (part 3, #3)
  }catch(e){sErr('Could not reach BridgePit.')}
  btn.disabled=false;
}

async function deleteStrat(){
  if(!EDITING)return;
  sErr('');
  try{
    const r=await fetch(`/api/strategies/${encodeURIComponent(EDITING)}/delete`,{method:'POST'});
    const d=await r.json();
    if(!r.ok){sErr(d.error||'Could not delete.');return}
    closeStratModal();refresh();loadInsts();
  }catch(e){sErr('Could not reach BridgePit.')}
}

// modal
function openModal(){showErr('');pickWorld('funded');document.getElementById('modalBg').classList.add('show');brokerHint()}
// A dialog you cannot dismiss with Escape, and whose focus walks out onto the
// page behind it, is the kind of thing that reads as unfinished the first time
// a keyboard user meets it. One handler for every modal in the app.
function _openModalBg(){return [...document.querySelectorAll('.modal-bg.show')].pop()}
function _modalFocusables(bg){
  return [...bg.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(e=>!e.disabled&&e.offsetParent!==null);
}
document.addEventListener('keydown',e=>{
  const bg=_openModalBg(); if(!bg)return;
  if(e.key==='Escape'){
    e.preventDefault();
    // two-stage: an open suggestion list is what Escape dismisses first, so
    // typing is never thrown away by the keystroke that closes a popup
    const sug=document.getElementById('iSuggest');
    if(sug&&sug.style.display!=='none'&&bg.contains(sug)){
      sug.style.display='none'; const s=document.getElementById('iSearch'); if(s)s.focus();
      return;
    }
    const cancel=[...bg.querySelectorAll('button')].find(b=>/^cancel$/i.test(b.textContent.trim()));
    if(cancel)cancel.click(); else bg.classList.remove('show');
    return;
  }
  if(e.key!=='Tab')return;
  const f=_modalFocusables(bg); if(!f.length)return;
  const first=f[0], last=f[f.length-1];
  if(e.shiftKey&&(document.activeElement===first||!bg.contains(document.activeElement))){
    e.preventDefault(); last.focus();
  }else if(!e.shiftKey&&(document.activeElement===last||!bg.contains(document.activeElement))){
    e.preventDefault(); first.focus();
  }
});
function closeModal(){document.getElementById('modalBg').classList.remove('show')}
function showErr(m){const e=document.getElementById('mErr');e.style.display=m?'block':'none';e.textContent=m}
function brokerHint(){
  const b=document.getElementById('mBroker').value;
  const rith=b==='rithmic';
  for(const id of ['fSystem','fUrl'])document.getElementById(id).style.display=rith?'block':'none';
  for(const id of ['fCid','fSec','fEnv'])document.getElementById(id).style.display=rith?'none':'block';
  showErr('');
}

// System/Gateway are pickers with a free-text escape. The escape is NOT
// optional: prop firms run their own named systems, and Rithmic have not yet
// sent the final system list - without it, most real users could not connect.
function otherToggle(which){
  const sel=document.getElementById('m'+which);
  const inp=document.getElementById('m'+which+'Other');
  const other=sel.value==='__other';
  inp.style.display=other?'block':'none';
  if(other)inp.focus();
}
function pickField(which){
  const sel=document.getElementById('m'+which);
  return sel.value==='__other'
    ? document.getElementById('m'+which+'Other').value.trim()
    : sel.value;
}

// Webhook token: fetched only on demand, never held in the 2s status poll.
let TOKEN_SHOWN=false;
async function fetchToken(){
  try{const r=await j('/api/webhook_token');return r.token||''}catch(e){return ''}
}
async function revealToken(){
  const ht=document.getElementById('hookToken'), btn=document.getElementById('hookReveal');
  if(TOKEN_SHOWN){
    ht.value='••••••••••••••••••••';btn.textContent='Reveal';TOKEN_SHOWN=false;return;
  }
  const t=await fetchToken();
  if(!t)return;
  ht.value=t;btn.textContent='Hide';TOKEN_SHOWN=true;
}
async function copyToken(){
  const t=await fetchToken();
  if(t)navigator.clipboard.writeText(t);
}

// ==== token changeover (tested by test_token_rotation.py) ====
// Replacing a leaked token in one step would refuse every alert still carrying
// the old one, so the customer's strategies stop trading while he edits alerts
// under pressure. Instead both tokens work at once, and the screen reports
// whether the old one is still arriving, so retiring it is a decision based on
// what is actually happening rather than on what he remembers doing.
function ago(iso){
  if(!iso)return null;
  const s=Math.max(0,(Date.now()-new Date(iso).getTime())/1000);
  if(s<90)return 'seconds ago';
  if(s<5400)return Math.round(s/60)+' minutes ago';
  if(s<172800)return Math.round(s/3600)+' hours ago';
  return Math.round(s/86400)+' days ago';
}
let TOK_LAST=0;
async function renderTokenChange(){
  const box=document.getElementById('tokChange');
  if(!box)return;
  // /api/webhook_token returns the ORDER-ENTRY credential. The 2s refresh
  // loop was pulling it on every tick, against the module's own rule that it
  // is fetched only on demand. Only when Settings is on screen, and at most
  // every 30s.
  if(!document.getElementById('settings').classList.contains('active'))return;
  if(Date.now()-TOK_LAST<30000)return;
  TOK_LAST=Date.now();
  let d={};
  try{d=await j('/api/webhook_token')}catch(e){return}
  const rows=d.tokens||[], old=rows.filter(r=>!r.primary);
  if(!old.length){
    box.innerHTML=`<div class="row" style="margin-top:10px"><button class="btn btn-ghost" onclick="newToken()">Create a new token</button>
      <span class="muted" style="font-size:12px;align-self:center">If this token has ever been on a screenshot or in a support message, replace it. Your alerts keep working while you switch them over.</span></div>`;
    return;
  }
  box.innerHTML=old.map(r=>{
    // An old token going quiet is NOT proof that no alert still carries it. A
    // strategy that fires twice a week is silent for days while every one of
    // its alerts is still on the old token. So never say "safe to retire":
    // report the silence, say how long it has lasted, and let the length of it
    // mean whatever the customer knows it means for HIS strategies.
    const inUse=r.last_used&&(!d.changeover_started||new Date(r.last_used)>new Date(d.changeover_started));
    const since=ago(d.changeover_started);
    const line=inUse
      ? `<b style="color:var(--amber)">still in use, last seen ${esc(ago(r.last_used))}</b> - an alert somewhere has not been moved across yet.`
      : `<b>no alert has used it${since?' in the '+esc(since.replace(' ago',''))+' since you created the new one':' yet'}</b>. That only means something if your strategies normally fire more often than that.`;
    return `<div class="card" style="margin-top:12px;background:var(--panel2)">
      <div style="font-size:13px;margin-bottom:8px"><b>Your old token still works.</b> Update your TradingView alerts to the new one above, then retire it here.</div>
      <div class="muted" style="font-size:12.5px">${line}</div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-ghost" onclick="retireToken()" style="color:var(--amber)">Retire the old token</button>
      </div></div>`;
  }).join('');
}
async function newToken(){
  const r=await j('/api/webhook_token/new',{method:'POST'});
  if(r&&r.error){alert(r.error);return}
  AB_TOKEN=null;AB_SHOWN=false;TOKEN_SHOWN=false;
  document.getElementById('hookToken').value='••••••••••••••••••••';
  document.getElementById('hookReveal').textContent='Reveal';
  await loadAlertBlock();
  renderTokenChange();
}
async function retireToken(){
  let rows=[];
  try{rows=(await j('/api/webhook_token')).tokens||[]}catch(e){return}
  const old=rows.find(r=>!r.primary);
  if(!old)return;
  const used=ago(old.last_used);
  if(!confirm(used
      ? `That token was last used by an alert ${used}. Any alert still sending it will be refused from now on, and that strategy stops trading until you fix it. Retire it?`
      : 'Retire the old token? Any alert still sending it will be refused from now on, and that strategy stops trading until you fix it. Silence is not proof that every alert has been moved across. Retire it?'))return;
  const r=await j('/api/webhook_token/retire',{method:'POST',headers:{'Content-Type':'application/json'},
                  body:JSON.stringify({token:old.token})});
  if(r&&r.error)alert(r.error);
  renderTokenChange();
}
// ==== end token changeover ====

// Rithmic require their artwork and copyright notices to be displayed whenever
// the app is connected to one of their deployments - and only then.
function renderRithmicAttrib(){
  const on=(CONNS||[]).some(c=>c.broker==='rithmic'&&c.status==='connected');
  for(const id of ['rithmicAttrib','sideRithmic']){
    const el=document.getElementById(id);
    if(el)el.classList.toggle('show',on);
  }
}

// connections
let CONNS=[];
async function loadConnections(){
  try{CONNS=await j('/api/connections');renderConnections()}catch(e){}
}
function renderConnections(){
  renderRithmicAttrib();   // first: must run even on the empty-list early return
  const el=document.getElementById('connList');
  if(!CONNS.length){el.className='grid';el.innerHTML='<div class="card muted" style="text-align:center;padding:32px">No connections yet. Click <b>+ Add connection</b> to link your broker.</div>';return}
  el.className='grid g2';
  const pill={connected:['ok','Connected'],connecting:['warn','Connecting…'],error:['bad','Error'],week_closed:['warn','Week closed'],disconnected:['bad','Not connected']};
  el.innerHTML=CONNS.map(c=>{
    const[cls,txt]=pill[c.status]||pill.disconnected;
    const acct=c.account?` · ${esc(c.account)}`:'';
    const execBadge=c.execute?'<span class="tag on" style="margin-left:6px">Executing</span>':'';
    const btn=c.status==='connected'
      ?`<button class="btn btn-ghost" onclick="connAction('${c.id}','disconnect')">Disconnect</button>`
      :`<button class="btn btn-p" onclick="connAction('${c.id}','connect')" ${c.supported?'':'disabled style=opacity:.5'}>Connect</button>`;
    const execLink=(!c.execute&&c.supported)?`<button class="btn-xs" onclick="connAction('${c.id}','execute')">Arm for execution</button>`
      :(c.execute?`<button class="btn-xs" onclick="connAction('${c.id}','unexecute')">Stand down</button>`:'');
    // Which world this login's accounts live in. It is decided ONCE, here,
    // and both limits pages only report it - a control on those pages would
    // be the app-wide switch all over again.
    const wld=(c.world==='own')?'own':'funded';
    const wBtn=`<button class="btn-xs" title="Funded: your firm's rules, an evening close. My brokerage: your own rules, may hold overnight." onclick="setConnWorld('${c.id}','${wld==='own'?'funded':'own'}')">${wld==='own'?'My brokerage':'Funded'}</button>`;
    const acBtn=`<button class="btn-xs" title="OFF = stand down: BridgePit will NOT grab the broker login on restarts, so you can use R Trader freely" onclick="setAutoconnect('${c.id}',${c.autoconnect?'false':'true'})">Auto-connect <b>${c.autoconnect?'on':'off'}</b></button>`;
    const errLine=(c.status==='error'||c.status==='week_closed')&&c.error?`<div class="muted" style="color:${c.status==='week_closed'?'var(--dim)':'var(--red)'};font-size:12px;margin-top:8px">${esc(friendlyErr(c.error))}</div>`:'';
    const soon=!c.supported?`<div class="hint" style="margin-top:var(--s2)">Coming soon</div>`:'';
    return `<div class="card"><div class="conn">
      <div class="ico">${esc(c.broker[0].toUpperCase())}</div>
      <div class="meta"><div class="n">${esc(c.label)} ${execBadge}</div>
        <div class="d">${c.label.toLowerCase()===c.broker.toLowerCase()?'':esc(c.broker[0].toUpperCase()+c.broker.slice(1))+' · '}${esc(c.user_masked)}${acct}</div></div>
      <span class="pill ${cls}"><span class="dot"></span>${txt}</span>
    </div>
    <div class="acts">${btn}<span class="quiet">${wBtn}${acBtn}${execLink}
      <button class="btn-xs" style="color:var(--red);border-color:rgba(196,87,74,.4)" onclick="confirmDelConn(this,'${c.id}')" title="Removes this connection and its stored credentials">Delete</button></span></div>
    ${errLine}${soon}</div>`;
  }).join('');
}
async function activateLicense(){
  const key=document.getElementById('licKey').value.trim();
  const err=document.getElementById('licErr');err.style.display='none';
  if(!key)return;
  const r=await fetch('/api/license',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
  const d=await r.json();
  if(!r.ok){err.style.display='block';err.textContent=d.error||'activation failed';return}
  document.getElementById('licKey').value='';loadBilling();refresh();
}
async function removeLicense(){
  if(!confirm('Remove this license? Live execution will stop until a new key or subscription is active.'))return;
  await fetch('/api/license',{method:'DELETE'});loadBilling();refresh();
}
async function setAutoconnect(id,on){
  try{const r=await j('/api/connections/'+id+'/autoconnect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({on})});if(r.connections){CONNS=r.connections;renderConnections()}}catch(e){}
}
async function connAction(id,action){
  const map={connect:['POST','/connect'],disconnect:['POST','/disconnect'],execute:['POST','/execute'],unexecute:['POST','/unexecute'],delete:['DELETE','']};
  const[method,path]=map[action];
  if(action==='delete'&&!confirm('Remove this connection? Its stored credentials will be deleted.'))return;
  // Arming is the moment the dependency list stops being theory. Show it here
  // rather than let the server's refusal be the first the customer hears of it.
  if(action==='execute'&&!await depsGate(id))return;
  if(action==='execute'&&!stopsGate(id))return;
  try{const r=await j('/api/connections/'+id+path,{method});
    connError(r.error||'');
    if(r.connections){CONNS=r.connections;renderConnections()}}catch(e){}
  loadConnections();refresh();
}
// Moving a login between worlds changes which protections apply to real
// money. It is the one thing the old switch did silently, so this one asks
// first and prints exactly what stops applying.
async function setConnWorld(id,to){
  let d;
  try{
    const r=await fetch(`/api/connections/${encodeURIComponent(id)}/world`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({world:to})});
    d=await r.json();
    if(!r.ok){connError(d.error||'Could not change this connection.');return}
  }catch(e){connError('Could not reach BridgePit.');return}
  const name=to==='own'?'My brokerage':'Funded accounts';
  const who=(d.accounts||[]).length?`\n\nAccounts affected: ${(d.accounts||[]).join(', ')}`:'';
  const costs=(d.costs||[]).length?`\n\n${d.costs.map(c=>'· '+c).join('\n')}`:'\n\nNothing stops applying.';
  if(!confirm(`Move this login to ${name}?${costs}${who}`))return;
  try{
    const r=await fetch(`/api/connections/${encodeURIComponent(id)}/world`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({world:to,confirm:true})});
    if(!r.ok){const e=await r.json();connError(e.error||'Could not change this connection.');return}
    loadConnections();loadWorlds();loadAccounts();
  }catch(e){connError('Could not reach BridgePit.')}
}

function connError(m){const e=document.getElementById('connErr');if(!e)return;e.style.display=m?'block':'none';e.textContent=m}
// A broker that cannot park a stop leaves the position protected by software
// only. The Terms say the customer is told BEFORE arming, not on the first
// fill - so it is asked here, and only when a stop is actually configured.
function stopsGate(id){
  const c=(CONNS||[]).find(x=>x.id===id);
  if(!c||c.holds_stops!==false)return true;
  const withStops=(STRATS||[]).filter(s=>Number(s.protective_stop_pts)>0).map(s=>s.name||s.strategy||'');
  if(!withStops.length)return true;
  return confirm('This broker cannot hold a stop order for you.\n\n'
    +withStops.length+' of your strategies carry a stop ('+withStops.slice(0,4).join(', ')
    +(withStops.length>4?'…':'')+'). At this broker those stops are not parked at the broker: '
    +'they are enforced by BridgePit on this machine. If this machine sleeps, quits or loses '
    +'its connection, the position is unprotected.\n\nArm live execution anyway?');
}
// what BridgePit depends on - read before the first live order (dependencies.py)
let DEPS={},DEPS_PENDING=null;
async function loadDeps(){
  try{DEPS=await j('/api/dependencies');renderDeps()}catch(e){}
}
function renderDeps(){
  const d=DEPS||{};
  const t=document.getElementById('depsTitle');if(t&&d.title)t.textContent=d.title;
  const i=document.getElementById('depsIntro');if(i)i.textContent=d.intro||'';
  const l=document.getElementById('depsList');
  if(l)l.innerHTML=(d.items||[]).map(it=>
    `<div class="card" style="margin-bottom:12px;padding:16px 20px"><div style="font-size:14px;margin-bottom:6px"><b>${esc(it.title)}</b></div><div class="muted" style="font-size:13px;line-height:1.55">${esc(it.detail)}</div></div>`).join('');
  const o=document.getElementById('depsOutro');if(o)o.textContent=d.outro||'';
  const k=document.getElementById('depsKeep');if(k)k.innerHTML='<b>'+esc(d.keep||'')+'</b>';
  const badge=document.getElementById('depsBadge');
  if(badge)badge.innerHTML=d.acknowledged
    ?'<span class="pill ok"><span class="dot"></span>Read</span>'
    :'<span class="pill warn"><span class="dot"></span>Not read - live arming blocked</span>';
  const s=document.getElementById('depsWhen');if(s)s.textContent=d.detail||'';
}
async function depsGate(pendingId){
  await loadDeps();
  if(DEPS.acknowledged)return true;
  DEPS_PENDING=pendingId||null;openDeps();return false;
}
function openDeps(){document.getElementById('depsErr').style.display='none';
  renderDeps();document.getElementById('depsBg').classList.add('show')}
function closeDeps(){DEPS_PENDING=null;document.getElementById('depsBg').classList.remove('show')}
async function ackDeps(){
  const err=document.getElementById('depsErr'),btn=document.getElementById('depsAckBtn');
  err.style.display='none';btn.disabled=true;
  try{
    const r=await j('/api/dependencies/ack',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:DEPS.version})});
    if(r.error){err.style.display='block';err.textContent=r.error;btn.disabled=false;return}
    DEPS=r;renderDeps();
    const go=DEPS_PENDING;closeDeps();
    if(go)connAction(go,'execute');else{loadPreflight()}
  }catch(e){err.style.display='block';err.textContent='Could not save that - try again.'}
  btn.disabled=false;
}
// forced alerting - the Settings card that proves the pipe before live arming
let ALERT={};
async function loadAlerting(){
  try{ALERT=await j('/api/alerting');renderAlerting()}catch(e){}
}
function renderAlerting(){
  const a=ALERT||{};
  const badge=document.getElementById('alertBadge');
  if(badge)badge.innerHTML=a.proven
    ?'<span class="pill ok"><span class="dot"></span>Proven</span>'
    :'<span class="pill warn"><span class="dot"></span>Not proven - live arming blocked</span>';
  const ch=document.getElementById('alertChannels');
  if(ch)ch.textContent=(a.channels&&a.channels.length?'Channels: '+a.channels.join(' + '):'No channel configured yet')+' - '+(a.detail||'');
}
async function sendAlertTest(){
  const btn=document.getElementById('alertTestBtn'),out=document.getElementById('alertResult'),cf=document.getElementById('alertConfirmBtn');
  btn.disabled=true;out.textContent='Sending through your real channels…';
  try{
    const r=await j('/api/alerting/test',{method:'POST'});
    const res=r.results||{};
    out.textContent=Object.entries(res).map(([k,v])=>k+': '+v).join(' · ');
    const anyOk=Object.values(res).some(v=>v==='ok');
    cf.disabled=!anyOk;
    if(anyOk)out.textContent+=' - check your phone/inbox, then click "I received it".';
    ALERT=r;renderAlerting();
  }catch(e){out.textContent='Test failed to run.'}
  btn.disabled=false;
}
async function confirmAlertTest(){
  const out=document.getElementById('alertResult');
  try{
    const r=await j('/api/alerting/confirm',{method:'POST'});
    if(r.error){out.textContent=r.error}
    else{out.textContent='Proven. Live execution can now be armed on the Connections page.';}
    ALERT=r;renderAlerting();loadPreflight();
  }catch(e){out.textContent='Confirm failed to run.'}
}
// billing
let BILL={};
async function loadBilling(){
  try{BILL=await j('/api/billing');renderBilling()}catch(e){}
  const fl=(BILL.plan==='desk')||BILL.owner_unlocked;
  document.querySelectorAll('#exportBtns a').forEach(a=>a.style.display=fl?'':'none');
  const lk=document.getElementById('exportLock');if(lk)lk.style.display=fl?'none':'';
}
// What the Subscription badge says, and its colour. Pure, so
// test_licence_badge.js can drive it directly.
//
// This used to be a hardcoded green pill built from the mere PRESENCE of a
// licence object. billing.public_status() handed one over whenever the
// signature verified, and an expired key verifies forever by design - expiry is
// an entitlement-time question, not an activation-time one. So a lapsed licence
// sat here in green with "valid until" beside it while live arming was already
// being refused.
//
// Green requires a positive answer: active === true, and nothing else. Not the
// absence of a problem, and never a date this function works out for itself -
// that second computation is exactly how the screen and the engine came to
// disagree, and the 3-day grace period lives only in the engine.
// Returns PLAIN TEXT, never html. renderBilling escapes what it inserts, and
// escaping here as well turned a customer's own address into a&amp;b@c.com on
// his screen. One owner for escaping, and it is the renderer.
function licencePill(lic){
  lic=lic||{};
  const plan=String(lic.plan||'').toUpperCase();
  const who=[lic.id,lic.email].filter(Boolean).join(' · ');
  const when=lic.exp?'valid until '+lic.exp:(lic.exp===null?'lifetime':'');
  if(lic.active===true)
    return {cls:'ok', text:`${plan?plan+' ':''}license active`,
            note:[who,when].filter(Boolean).join(' · ')};
  if(lic.active===false)
    return {cls:'bad', text:`${plan?plan+' ':''}license EXPIRED`,
            note:[who, lic.exp?'lapsed '+lic.exp:'', 'live arming is being refused']
                 .filter(Boolean).join(' · ')};
  // No answer at all: a page served alongside an older engine. Not green.
  return {cls:'warn', text:`${plan?plan+' ':''}license - not confirmed`,
          note:[who,'reload the dashboard'].filter(Boolean).join(' · ')};
}
function renderBilling(){
  const b=BILL;const plan=(b.plan||'free');
  const foot=document.getElementById('planName');
  if(foot)foot.textContent=b.owner_unlocked?'Owner (unlocked)':(b.license?plan.charAt(0).toUpperCase()+plan.slice(1)+' · licensed':(plan==='free'?'Free · paper':plan.charAt(0).toUpperCase()+plan.slice(1)+(b.status==='trialing'?' · trial':'')));
  const ls=document.getElementById('licStatus'),lr=document.getElementById('licRow');
  if(ls&&b.license){
    const lp=licencePill(b.license);
    ls.innerHTML=`<span class="pill ${lp.cls}"><span class="dot"></span>${esc(lp.text)}</span> <span class="muted" style="margin-left:8px">${esc(lp.note)}</span> <button class="btn btn-ghost" style="margin-left:10px" onclick="removeLicense()">Remove</button>`;
    if(lr)lr.style.display='none';
  }else if(ls&&lr){lr.style.display='flex'}
  const banner=document.getElementById('billBanner');
  if(!b.billing_enabled){
    banner.style.display='block';
    banner.innerHTML=b.owner_unlocked
      ?'<b>Owner mode</b> - live execution is unlocked on this install. Billing is disabled.'
      :'<span class="muted">Billing isn\'t configured on this install yet. Live execution runs in paper mode until a subscription is active.</span>';
  }else if(b.status==='trialing'||b.status==='active'){
    banner.style.display='block';
    const NAMES={pro:'Seat',multi:'Desk',desk:'Floor'};
    const end=b.current_period_end?new Date(b.current_period_end*1000).toLocaleDateString():'';
    const pend=b.pending_plan?` Switches to ${NAMES[b.pending_plan]||b.pending_plan} on ${b.pending_at?new Date(b.pending_at*1000).toLocaleDateString():'the renewal date'} - nothing changes until then.`:'';
    banner.innerHTML=`<span class="pill ok"><span class="dot"></span>${NAMES[plan]||plan} ${b.status}</span> <span class="muted" style="margin-left:8px">Live execution enabled${end?' · renews '+end:''}.${esc(pend)}</span>`;
  }else{banner.style.display='none'}
  const setBtn=(id,label,cur)=>{const el=document.getElementById(id);if(!el)return;el.textContent=cur?'Current plan':label;el.disabled=cur;el.classList.toggle('btn-ghost',cur)};
  setBtn('btnPro',b.status==='trialing'?'Start 7-day trial':'Upgrade to Seat',plan==='pro');
  setBtn('btnMulti','Choose Desk',plan==='multi');
  setBtn('btnDesk','Choose Floor',plan==='desk');
  // a waiting downgrade: its button says so, and the current plan's button
  // turns into the cancel path instead of a dead "Current plan"
  if(b.pending_plan){
    const ids={pro:'btnPro',multi:'btnMulti',desk:'btnDesk'};
    const pb=document.getElementById(ids[b.pending_plan]);
    if(pb){pb.textContent='Scheduled - starts '+(b.pending_at?new Date(b.pending_at*1000).toLocaleDateString():'at renewal');pb.disabled=true;pb.classList.add('btn-ghost')}
    const cb=document.getElementById(ids[plan]);
    if(cb){cb.textContent='Keep '+(({pro:'Seat',multi:'Desk',desk:'Floor'})[plan]||plan);cb.disabled=false;cb.classList.remove('btn-ghost')}
  }
}
async function quitApp(){
  if(!confirm('Quit BridgePit? This stops execution immediately. Make sure your positions are flat.'))return;
  // Only claim "stopped" when the server ACCEPTED the quit - the old version
  // painted "BridgePit has stopped" over a failed request while the engine
  // kept executing behind it.
  try{
    const r=await j('/api/quit',{method:'POST'});
    if(!r||r.ok!==true)throw new Error('quit refused');
  }catch(e){
    alert('BridgePit did NOT stop - the quit request failed. It is still running and still executing.');
    return;
  }
  document.body.innerHTML='<div style="display:grid;place-items:center;height:100vh;color:#989898;font:16px -apple-system,sans-serif">BridgePit has stopped. You can close this tab.</div>';
}
// Flatten closes what is open. It does NOT stop the next alert from opening
// something new - that is Halt, a separate button. Someone reaching for this
// one is usually reaching for "make it all stop", and the old confirm never
// said which of the two it was doing. So it says so, and offers the other half
// rather than making the customer know the difference under pressure.
async function flattenAll(){
  if(!confirm('Close ALL open positions on every connected account, right now, at market?\n\nThis closes positions only. Your strategies stay armed and the next alert can open a new one.'))return;
  // The old version said "Positions closed." no matter what the server
  // answered - including when the broker could NOT confirm flat and the book
  // was restored, and even when the request itself failed. Never claim a
  // flatten worked without the server saying so.
  let flat=null;
  try{flat=await j('/api/flatten',{method:'POST'})}catch(e){}
  if(!flat||flat.ok!==true){
    alert('The flatten could NOT be confirmed by the broker - treat your positions as still open. Check the account at the broker now, then try again.');
    refresh();loadAccounts();
    return;
  }
  let halted=false;
  try{halted=(await j('/api/status')).halted}catch(e){}
  if(!halted&&confirm('Positions closed (broker confirmed).\n\nAlso stop new entries until you switch them back on?\n\nOK = halt, so no alert can open anything.\nCancel = leave your strategies armed.')){
    try{await j('/api/halt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({halt:true})})}catch(e){}
  }
  refresh();loadAccounts();
}
async function startCheckout(plan){
  try{
    const r=await j('/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})});
    if(r.changed){loadBilling();alert('Plan switched to '+r.changed+'. The prorated difference was charged now; next month is the plain new price.');return}
    if(r.scheduled){loadBilling();alert('Downgrade scheduled. Your current plan runs until '+(r.at?new Date(r.at*1000).toLocaleDateString():'the renewal date')+' - nothing is charged or credited now. The new price starts then. Pick your current plan again any time before that to cancel.');return}
    if(r.url){location.href=r.url;return}
    // A customer build has no Stripe keys by design - the website is the
    // storefront. A buyer mid-purchase goes THERE, not to a support inbox
    // ("email us to give us money" was the previous behaviour).
    if(r.error==='billing not configured'){window.open('https://bridgepit.com/#pricing','_blank');return}
    alert('Could not start checkout: '+(r.error||'unknown error'));
  }catch(e){alert('Checkout request failed.')}
}

// Which world a login belongs to is asked HERE, once, because it decides
// whether an evening close flattens this account. It used to be a small
// button on a card the customer had no reason to open, so a personal account
// completed setup inside the funded world and got force-flattened at 15:55.
let NEW_WORLD='funded';
function pickWorld(w){
  NEW_WORLD=(w==='own')?'own':'funded';
  document.querySelectorAll('#mWorldSeg button').forEach(b=>
    b.classList.toggle('on',b.dataset.world===NEW_WORLD));
  document.getElementById('mWorldHint').innerHTML=NEW_WORLD==='own'
    ?'Your own broker. It follows the limits on <b>My brokerage</b>: your rules, and it may hold overnight. No evening close unless you switch one on.'
    :"A prop firm's account. It follows the limits on <b>Funded accounts</b>: your daily stop, your drawdown stop, and the evening close, because most firms forbid holding overnight.";
}

async function submitConnection(){
  const btn=document.getElementById('mSubmit');
  const body={
    broker:document.getElementById('mBroker').value,
    label:document.getElementById('mLabel').value,
    user:document.getElementById('mUser').value,
    password:document.getElementById('mPass').value,
    system_name:pickField('System'),
    url:pickField('Url'),
    cid:document.getElementById('mCid').value,
    sec:document.getElementById('mSec').value,
    environment:document.getElementById('mEnv').value,
    account_id:document.getElementById('mAcct').value,
    world:NEW_WORLD,
  };
  if(!body.user||!body.password){showErr('Username and password are required.');return}
  if(body.broker==='rithmic'&&!body.system_name){showErr('Choose a Rithmic system, or pick Other and type the name your broker or firm gave you.');return}
  if(body.broker==='rithmic'&&!body.url){showErr('Choose a gateway, or pick Other and enter its address.');return}
  btn.disabled=true;btn.textContent='Connecting…';showErr('');
  try{
    const r=await j('/api/connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.connections){CONNS=r.connections;renderConnections()}
    const res=r.connect||{};
    if(res.ok===false){showErr(res.error||'Could not connect - connection saved. Check credentials and try Connect.');}
    else{closeModal();document.getElementById('mUser').value='';document.getElementById('mPass').value='';document.getElementById('mLabel').value='';document.getElementById('mAcct').value=''}
  }catch(e){showErr('Request failed. Is BridgePit running?')}
  btn.disabled=false;btn.textContent='Save & Connect';
  refresh();
}

// ------------------------------------------------------------- live data
// Every API read goes through j(). A 401 here means the session expired or was
// never issued, so the gate is raised from ONE place rather than each caller
// remembering to check - a caller that forgets would silently render an empty
// dashboard and look like a broker outage.
async function j(u,o){
  const r=await fetch(u,o);
  if(r.status===401){ showGate(); throw new Error('auth') }
  return r.json();
}
function showGate(mode){
  const g=document.getElementById('authGate');
  if(!g)return;
  // Every background poll that gets a 401 lands here - refresh alone fires
  // every 2s. Re-running the whole body while the user is typing stole focus
  // back to the first field and wiped the error text before it could be read.
  // So re-render only when the gate opens or its mode actually changes.
  const alreadyOpen = g.style.display === 'flex';
  if(mode)g.dataset.mode=mode;
  if(alreadyOpen && g.dataset.rendered === g.dataset.mode) return;
  g.dataset.rendered = g.dataset.mode;
  g.style.display='flex';
  const setup=g.dataset.mode==='setup';
  document.getElementById('authTitle').textContent=setup?'Welcome to BridgePit':'Unlock BridgePit';
  document.getElementById('authWhy').textContent=setup
    ?'Set a password to protect this dashboard. It guards your broker connection, your account data and your webhook token. There is no account to create and no recovery e-mail.'
    :'Enter the password you set on this computer.';
  document.getElementById('authGo').textContent=setup?'Set password':'Unlock';
  document.getElementById('authConfirmRow').style.display=setup?'':'none';
  document.getElementById('authErr').textContent='';
  setTimeout(()=>document.getElementById('authPw').focus(),50);
}
async function authSubmit(){
  const pw=document.getElementById('authPw').value;
  const g=document.getElementById('authGate');
  const setup=g.dataset.mode==='setup';
  const err=document.getElementById('authErr');
  if(setup){
    if(pw.length<8){err.textContent='At least 8 characters.';return}
    if(pw!==document.getElementById('authPw2').value){err.textContent='The two passwords do not match.';return}
  }
  const r=await fetch(setup?'/api/auth/setup':'/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){err.textContent=d.error||'Could not sign in.';return}
  document.getElementById('authPw').value='';
  const p2=document.getElementById('authPw2'); if(p2)p2.value='';
  g.style.display='none';
  // EVERY one-time loader, not just a few: before login they all answered 401,
  // so anything missed here shows an empty screen until a manual page reload
  // (found 2026-08-14: the risk-limit boxes sat blank over a configured $1,000).
  refresh();loadConnections();loadAccounts();loadBilling();loadAlerting();loadDeps();
  loadWorlds();loadPerf();loadPreflight();loadInsts();loadNotify();loadPort();
}
async function authForgot(){
  const box=document.getElementById('authForgot');
  box.innerHTML='Look at this Mac\'s screen: a BridgePit dialog is asking you to confirm.';
  let d={};
  try{ d=await (await fetch('/api/auth/reset_request',{method:'POST'})).json() }catch(e){}
  const r=d.result||'unavailable';
  if(r==='reset'){
    box.innerHTML='Reset. Choose a new password.';
    document.getElementById('authGate').dataset.rendered='';
    showGate('setup');
  }else if(r==='cancelled'){
    box.innerHTML='Cancelled on this Mac. <a style="cursor:pointer;color:var(--dim);text-decoration:underline" onclick="authForgot()">Try again</a>';
  }else if(r==='busy'){
    box.innerHTML='A reset was asked for a moment ago. Wait two minutes and press Forgot it again.';
  }else{
    box.innerHTML='This Mac could not show the dialog. Quit BridgePit, open Finder, press Cmd+Shift+G, paste ~/Library/Application Support/BridgePit/state, move the file named auth.json to the Trash, then open BridgePit again.';
  }
}
async function authBoot(){
  try{
    const s=await (await fetch('/api/auth/status')).json();
    if(!s.configured){showGate('setup');return false}
    const probe=await fetch('/api/status');
    if(probe.status===401){showGate('login');return false}
  }catch(e){}
  return true;
}
function esc(s){return String(s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}
const fmt$=v=>'$'+Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0});
const fmtSigned=v=>v==null?'':(v<0?'−':'+')+fmt$(v);
const pnlHtml=(p,cls)=>p==null?'<span class="pnl zero" style="color:var(--dim2)">-</span>'
  :`<span class="pnl ${p>0?'up':p<0?'dn':'zero'} ${cls||''}">${p>0?'+':p<0?'−':''}${fmt$(p)}</span>`;

// accounts
let ACCTS=[],SEL='__all',STRATS=[],EQ={},TRADES={trips:[],strategies:{}};
let PERF_DAYS=30,WEEK_CLOSED=false,ACCTS_CONFIGURED=false;

// equity sparkline: EOD balance, today's live balance appended as last point.
// Single series on the card - the caption names it, values on hover (<title>).
function sparkline(rows,liveBal){
  const pts=(rows||[]).map(r=>({d:r.date,v:r.balance}));
  if(liveBal!=null&&(!pts.length||pts[pts.length-1].v!==liveBal))pts.push({d:'now',v:liveBal});
  if(pts.length<2)return '';
  const W=240,H=38,P=3;
  const vs=pts.map(p=>p.v),mn=Math.min(...vs),mx=Math.max(...vs),span=(mx-mn)||1;
  const x=i=>P+i*(W-2*P)/(pts.length-1), y=v=>H-P-(v-mn)*(H-2*P)/span;
  const line=pts.map((p,i)=>`${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const up=pts[pts.length-1].v>=pts[0].v;
  const col=up?'var(--green)':'var(--red)';
  const dots=pts.map((p,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="6" fill="transparent"><title>${p.d}  $${p.v.toLocaleString(undefined,{maximumFractionDigits:0})}</title></circle>`).join('');
  return `<div class="spark"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <polyline points="${line}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>
    <circle cx="${x(pts.length-1).toFixed(1)}" cy="${y(pts[pts.length-1].v).toFixed(1)}" r="2.6" fill="${col}"/>${dots}</svg>
    <div class="cap">equity · ${rows&&rows.length?rows.length+'d':''} ${up?'▲':'▼'} $${Math.abs(pts[pts.length-1].v-pts[0].v).toLocaleString(undefined,{maximumFractionDigits:0})}</div></div>`;
}

// ---- Getting set up: the guided first run (Gilles' stranger run, #1).
// One step at a time, the current one highlighted with its single action;
// the paper fill comes first because it works with zero setup - the
// ten-minute win. Dismissible for people who know what they're doing.
let SETUP=null;
let _closeArm=0;
function confirmClose(){
  const b=document.getElementById('closeAllBtn');
  if(Date.now()-_closeArm>4500){_closeArm=Date.now();
    b.textContent='Really close all? Entries stay ARMED - click again (or Halt first)';
    setTimeout(()=>{if(Date.now()-_closeArm>=4400)b.textContent='Close all positions'},4500);return}
  _closeArm=0;b.textContent='Close all positions';flattenAll();
}
// The server composes the whole error (friendly translation + the weekend
// calendar note when the futures week is shut). A client-side rewrite here
// used to SUBSTITUTE its own guess and silently delete that note - one
// message, two translators. The screen now shows the server's words as-is.
function friendlyErr(t){return t}
function confirmRevoke(){
  const b=document.getElementById('revokeBtn');
  if(!b.dataset.arm){b.dataset.arm='1';b.textContent='Every session dies, this one too - click again';
    setTimeout(()=>{b.dataset.arm='';b.textContent='Sign out everywhere'},4500);return}
  b.dataset.arm='';
  fetch('/api/auth/signout_everywhere',{method:'POST'}).finally(()=>location.reload());
}
function confirmDelConn(b,id){
  if(!b.dataset.arm){b.dataset.arm='1';b.textContent='Delete credentials? click again';
    setTimeout(()=>{b.dataset.arm='';b.textContent='Delete'},4500);return}
  b.dataset.arm='';connAction(id,'delete');
}
function arrangeDash(){
  const perf=document.getElementById('perfSec'),blot=document.getElementById('blotSec'),act=document.getElementById('actSec');
  if(!perf||!blot||!act)return;
  const trips=(typeof TRADES!=='undefined'&&TRADES.trips)?TRADES.trips.length:0;
  perf.style.display=trips?'':'none';blot.style.display=trips?'':'none';
  const dash=act.parentElement,setupOn=SETUP&&!SETUP.done&&!SETUP.dismissed;
  // promoted only while setting up AND nothing has traded yet - once real
  // trades exist the trade tables are the story again (part 3, #6)
  const promote=setupOn&&!(TRADES.trips||[]).length;
  if(promote&&act.nextSibling!==perf)dash.insertBefore(act,perf);
  if(!promote&&blot.nextSibling!==act)dash.insertBefore(act,blot.nextSibling);
}
async function loadSetup(){
  try{SETUP=await j('/api/setup')}catch(e){return}
  const el=document.getElementById('setupRail');
  if(!el)return;
  if(!SETUP||SETUP.dismissed||SETUP.done){el.style.display='none';document.body.classList.remove('setup-active');arrangeDash();return}
  document.body.classList.add('setup-active');
  const cur=SETUP.steps.find(s=>!s.done);
  el.style.display='block';
  // Presentation: the same rail language as the public-address walkthrough,
  // so "a guided sequence" looks like one thing everywhere in the app.
  const doneN=SETUP.steps.filter(s=>s.done).length, allN=SETUP.steps.length;
  el.innerHTML=`<div class="su-head">
      <div><b class="su-title">Getting set up</b>
        <div class="muted su-sub">${doneN} of ${allN} done - the next step is the only one you need.
          Following the written guide? It covers the same ground with pictures.</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none">
        <button class="btn btn-ghost su-guide" onclick="openGuide()">Open the setup guide</button>
        <a href="#" class="muted su-hide" onclick="dismissSetup();return false">I know what I'm doing - hide this</a>
      </div>
    </div>
    <div class="su-meter"><i style="width:${Math.round(doneN/allN*100)}%"></i></div>
    <ol class="su-rail">`+SETUP.steps.map((s,i)=>{
    const on=cur&&s.id===cur.id;
    const st=s.done?'done':(on?'cur':'todo');
    return `<li class="su-step ${st}">
      <span class="su-disc">${s.done?'✓':i+1}</span>
      <div class="su-body"><div class="su-label">${esc(s.label)}</div>
        ${on?`<div class="muted su-detail">${esc(s.detail)}</div>`:''}</div>
      ${on?setupBtn(s):''}</li>`;
  }).join('')+`</ol>`;
}
function setupBtn(s){
  const b=(t,fn)=>`<button class="btn btn-p" style="flex:none;white-space:nowrap" onclick="${fn}">${t}</button>`;
  if(s.id==='fill')return b('Send a test alert','setupTestFill()');
  if(s.id==='broker')return b('Connect broker',"go('connections')");
  if(s.id==='tv')return b('Show my webhook',"go('settings')");
  if(s.id==='live')return b('Choose account',"go('connections')");
  return '';
}
async function setupTestFill(){
  const st=(STRATS||[]).find(s=>s.enabled)||(STRATS||[])[0];
  if(!st){go('strategies');return}
  try{
    const r=await fetch('/api/alert_test',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({strategy_name:st.name})});
    const d=await r.json();
    if(d&&d.ok){loadSetup();loadPerf();refresh();
      setTimeout(()=>{const c=document.getElementById('actSec');if(c)c.scrollIntoView({behavior:'smooth',block:'center'});
        document.querySelectorAll('#logBody tr').forEach((r,i)=>{if(i<5)r.classList.add('flashrow')});
        setTimeout(()=>document.querySelectorAll('.flashrow').forEach(r=>r.classList.remove('flashrow')),2600);},800);}
    else{go('settings')}          // the full test UI there explains what failed
  }catch(e){go('settings')}
}
// The guide is the one thing the app kept naming and never opened. A
// navigation on a deliberate click, never a render-time load - see
// test_no_outbound.py, which pins that distinction.
function openGuide(){ window.open('https://bridgepit.com/setup', '_blank', 'noopener'); }

async function dismissSetup(){
  try{await fetch('/api/setup/dismiss',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({dismissed:true})})}catch(e){}
  loadSetup();
}

// The one line he actually reads. The block below it is <details>, shut by
// default, so anything this line leaves out is invisible in practice.
//
// It used to name the FIRST red and stop. 1.4.4 added three reds at the END of
// the list (gap, notify_queue, notify_dropped), so with anything at all wrong
// ahead of them they were never mentioned. A summary that says one problem when
// there are three is not a summary, it is a wrong number.
//
// Counts REDS only. A first run is covered in neutral to-dos and nothing is
// wrong with it - calling those problems would be the 2026-08-11 false alarm in
// a new place, and the day-one rule says never-set-up is a to-do, never a fault.
function pfText(t){return String(t||'').replace(/\s+[\u2014\u2013]\s+/g,', ')}
function preflightHead(checks){
  const list=Array.isArray(checks)?checks:[];
  const bad=list.filter(c=>c&&c.ok===false);
  if(bad.length){
    const first=bad[0];
    const name=first.label||first.id||'a check';
    const why=first.detail?`: ${first.detail}`:'';
    // one problem reads better named than counted
    return bad.length===1?`⚠ ${name}${why}`
                         :`⚠ ${bad.length} problems · ${name}${why}`;
  }
  const todo=list.find(c=>c&&c.ok===null&&/to do/i.test(c.detail||''));
  if(todo)return `Next: ${String(todo.detail||'').replace(/^to do - /i,'')}`;
  return `${list.length} checks - all clear`;
}

// One pill. Pure, so the dismiss control can be tested without a DOM.
//
// A check carrying `ack` names the endpoint that clears it, and only the few
// that CAN be cleared carry one. Deciding by id here instead would put the
// knowledge of which warnings are dismissible in two files.
function preflightPill(c){
  c=c||{};
  const cls=c.ok===true?'ok':c.ok===false?'bad':'info';
  const ack=c.ack
    ?` <a class="pf-ack" onclick="ackCheck('${esc(c.ack)}')" title="Stop showing this. The downtime itself stays in the activity log - the alerts it lost do not come back.">dismiss</a>`
    :'';
  const dt=c.ok===true?'<span class="dt"></span>':`<span class="dt">${esc(pfText(c.detail))}${ack}</span>`;
  return `<span class="pf ${cls}" title="${esc(pfText(c.detail))}"><span class="d"></span><span class="lb">${esc(c.label)}</span>${dt}</span>`;
}

async function ackCheck(url){
  try{ await j(url,{method:'POST'}) }catch(e){}
  loadPreflight();
}

async function loadPreflight(){
  try{
    const r=await j('/api/preflight');
    const pills=(r.checks||[]).map(preflightPill).join('');
    const head=pfText(preflightHead(r.checks));
    const wrap=document.getElementById('preflight');
    const wasOpen=!!wrap.querySelector('details[open]');
    wrap.innerHTML=
      `<details${wasOpen?' open':''}><summary>${esc(head)}<span class="btn-xs" style="margin-left:auto;flex:none">Details</span></summary><div class="pfgrid">${pills}</div></details>`;
  }catch(e){}
}

function setPerfDays(d){
  PERF_DAYS=d;
  document.querySelectorAll('.perfwin button').forEach(b=>b.classList.toggle('on',+b.dataset.d===d));
  document.querySelectorAll('.perfwin-label').forEach(e=>e.textContent=d?`last ${d} days`:'all history');
  loadPerf();
}
async function loadPerf(){
  try{EQ=await j('/api/equity?days=90')}catch(e){}
  try{TRADES=await j('/api/trades?days='+PERF_DAYS)}catch(e){}
  renderPerf();renderBlotter();renderAccounts();renderStrategyCards();
}

// per-trade P&L bars: chronological, zero baseline, green up / red down
function tradeBars(trips){
  const t=trips.slice(-14);
  if(!t.length)return '';
  const W=280,H=52,mid=H/2,P=2;
  const mx=Math.max(...t.map(x=>Math.abs(x.pnl||0)))||1;
  const bw=Math.min(16,(W-(t.length-1)*3)/t.length);
  const bars=t.map((x,i)=>{
    const v=x.pnl||0,h=Math.max(2,Math.abs(v)/mx*(mid-P));
    const y=v>=0?mid-h:mid;
    const c=v>=0?'var(--green)':'var(--red)';
    const ts=(x.ts_close||'').replace('T',' ').slice(5,16);
    return `<rect x="${(i*(bw+3)).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${c}" opacity=".85"><title>${ts}  ${v>=0?'+':'−'}$${Math.abs(v).toLocaleString()}</title></rect>`;
  }).join('');
  return `<div class="bars"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <line x1="0" y1="${mid}" x2="${W}" y2="${mid}" stroke="var(--line2)" stroke-width="1"/>${bars}</svg>
    <div class="cap">last ${t.length} closed trades</div></div>`;
}

function renderStrategyCards(){
  const el=document.getElementById('stratCards');
  if(!el)return;
  const sec=document.getElementById('stratPerfSec');
  const agg=TRADES.strategies||{};
  const byStrat={};
  for(const t of (TRADES.trips||[]))(byStrat[t.strategy]=byStrat[t.strategy]||[]).unshift(t);
  // config strategies first (by 30d P&L desc), then non-config actors (manual)
  const cfgNames=STRATS.map(s=>s.name);
  let hiddenPerf=[];try{hiddenPerf=JSON.parse(localStorage.getItem('perfHiddenNames')||'[]')}catch(e){}
  const extras=Object.keys(agg).filter(n=>!cfgNames.includes(n)&&!legInfo(n)&&!hiddenPerf.includes(n));
  const names=[...cfgNames.sort((a,b)=>((agg[b]||{}).pnl||0)-((agg[a]||{}).pnl||0)),...extras]
    // a card earns its place with a closed trade: on day one this block said
    // "no closed trades" under a dash and nothing else (part 2, #5)
    .filter(n=>stratShown(agg[n]));
  if(!names.length){if(sec)sec.style.display='none';el.innerHTML='';return}
  if(sec)sec.style.display='';
  el.className='grid g2';
  el.innerHTML=names.map(n=>{
    const cfg=STRATS.find(s=>s.name===n);
    const s=agg[n];
    const trips=byStrat[n]||[];
    const acct=cfg?(cfg.account||(ACCTS.find(a=>a.default)||{}).id):null;
    const avg=s&&s.trades?s.pnl/s.trades:null;
    const pf=s?(s.pf!=null?s.pf.toFixed(2):(s.gross_win>0?'∞':'-')):'-';
    const sample=(n==='My_First_Strategy'&&(!s||!s.trades))?'<span class="tag off" title="Ships with BridgePit so your first test alert has somewhere to land. Rename it or delete it once your own strategies are in.">sample</span>':'';
    const hideBtn=cfg?'':`<button class="btn-xs" title="Hide this card. Its trades stay in the blotter and account P&L - this only retires the name from Performance." onclick="hidePerfName('${esc(n)}')">Hide</button>`;
    const status=(cfg?`<span class="tag ${cfg.enabled?'on':'off'}">${cfg.enabled?'enabled':'off'}</span>`:'<span class="tag off" title="Fills recorded under a name that is not one of your strategies (retired name, or a manual trade)">retired name</span>')+sample+hideBtn;
    const sub=cfg?`${esc(cfg.symbol)} ×${cfg.multiplier}${cfg.position?` · pos ${cfg.position}`:''}`:'non-strategy fills';
    return `<div class="card scard">
      <div class="head">
        <div><div class="nm">${esc(n)}</div><div class="sub">${sub}</div></div>
        <div style="display:flex;gap:6px;align-items:center">${acct?acctChip(acct):''}${status}</div>
      </div>
      ${s?pnlHtml(s.pnl):'<span class="pnl" style="color:var(--dim2)">-</span>'}
      <div class="muted" style="font-size:12px;margin-top:2px">${s?`${PERF_DAYS?PERF_DAYS+'-day':'all-time'} P&L · ${s.trades} trade${s.trades===1?'':'s'}`:(PERF_DAYS?'no closed trades in the last '+PERF_DAYS+' days':'no closed trades yet')}</div>
      ${s&&s.unpriced?`<div style="font-size:12px;margin-top:2px;color:var(--amber)">${s.unpriced} trade${s.unpriced>1?'s':''} not counted - no point value for ${esc((s.unpriced_symbols||[]).join(', '))}</div>`:''}
      ${tradeBars(trips)}
      ${s?`<div class="srow">
        <div>Win rate<b>${s.win_rate}%</b></div>
        <div>Profit factor<b>${pf}</b></div>
        <div>Avg / trade<b style="color:${avg>0?'var(--green)':avg<0?'var(--red)':'var(--txt)'}">${avg>0?'+':avg<0?'−':''}${fmt$(avg)}</b></div>
        <div>Best / worst<b>${(()=>{const ps=trips.map(t=>t.pnl).filter(v=>v!=null);if(!ps.length)return '-';const f=v=>(v>0?'+':v<0?'−':'')+fmt$(v);return `${f(Math.max(...ps))} / ${f(Math.min(...ps))}`})()}</b></div>
      </div>`:''}
    </div>`;
  }).join('');
}
// per-strategy stats for ONE account's trips, client-side. The server's
// aggregate covers "All accounts"; a selected account must see ITS book only -
// the same strategy on two accounts is two separate books, never blended.
// Whether a strategy has earned a row. A card still needs SOMETHING to show, so
// day one stays clean, but "something" includes trades we could not price -
// filtering on the trade count alone is what made a strategy trading an
// unpriced instrument read as though it had never traded at all.
function stratShown(s){ return !!(s && (s.trades || s.unpriced)); }
function aggTrips(trips){
  const out={};
  const row=n=>out[n]=out[n]||{trades:0,wins:0,pnl:0,gross_win:0,gross_loss:0,last:'',
                               unpriced:0,unpriced_symbols:[]};
  for(const t of trips){
    if(t.pnl==null){
      // counted, named, and NOT dropped. The server's aggregate() does the
      // same, and both read the root the engine already computed.
      const s=row(t.strategy);
      s.unpriced++;
      const r=t.root||t.symbol;
      if(r&&!s.unpriced_symbols.includes(r))s.unpriced_symbols.push(r);
      if(t.ts_close>s.last)s.last=t.ts_close;
      continue;
    }
    const s=row(t.strategy);
    s.trades++;s.pnl=Math.round((s.pnl+t.pnl)*100)/100;
    if(t.pnl>0){s.wins++;s.gross_win=Math.round((s.gross_win+t.pnl)*100)/100}
    else if(t.pnl<0){s.gross_loss=Math.round((s.gross_loss-t.pnl)*100)/100}
    if(t.ts_close>s.last)s.last=t.ts_close;
  }
  for(const s of Object.values(out)){
    s.win_rate=s.trades?Math.round(s.wins/s.trades*100):0;
    s.pf=s.gross_loss>0?Math.round(s.gross_win/s.gross_loss*100)/100:null;
  }
  return out;
}
function renderPerf(){
  const agg=SEL==='__all'?(TRADES.strategies||{})
    :aggTrips((TRADES.trips||[]).filter(t=>(t.account||(ACCTS.find(a=>a.default)||{}).id)===SEL));
  const names=Object.keys(agg).sort((a,b)=>agg[b].pnl-agg[a].pnl);
  const el=document.getElementById('perfBody');
  if(!names.length){el.innerHTML='<tr><td colspan="6" class="muted" style="padding:24px;text-align:center">No closed trades yet'+(SEL==='__all'?'':' on this account')+'</td></tr>';return}
  el.innerHTML=names.map(n=>{const s=agg[n];
    const pf=s.pf!=null?s.pf.toFixed(2):(s.gross_win>0?'∞':'-');
    const li=legInfo(n);
    const un=s.unpriced?`<div class="evt-sub" style="color:var(--amber)">${s.unpriced} trade${s.unpriced>1?'s':''} not counted - no point value for ${esc((s.unpriced_symbols||[]).join(', '))}</div>`:'';
    return `<tr><td style="font-weight:550">${esc(dispName(n))}${li?' '+acctChip(li.account):''}${un}</td><td>${s.trades}</td><td>${s.win_rate}%</td>
      <td style="font-weight:650;color:${s.pnl>0?'var(--green)':s.pnl<0?'var(--red)':'var(--txt)'}">${s.pnl>0?'+':s.pnl<0?'−':''}${fmt$(s.pnl)}</td>
      <td>${pf}</td><td class="mono muted" style="font-size:12px">${esc((s.last||'').replace('T',' ').slice(5,16))}</td></tr>`}).join('');
}
function renderBlotter(){
  const trips=(TRADES.trips||[]).filter(t=>{
    if(SEL==='__all')return true;
    const acct=t.account||(ACCTS.find(a=>a.default)||{}).id;
    return acct===SEL;
  }).slice(0,25);
  const el=document.getElementById('blotBody');
  if(!trips.length){el.innerHTML='<tr><td colspan="8" class="muted" style="padding:24px;text-align:center">No trades yet</td></tr>';return}
  el.innerHTML=trips.map(t=>{
    const acct=t.account||(ACCTS.find(a=>a.default)||{}).id;
    const hold=t.hold_min==null?'-':t.hold_min<90?`${Math.round(t.hold_min)}m`:`${(t.hold_min/60).toFixed(1)}h`;
    return `<tr><td class="mono muted">${esc((t.ts_close||'').replace('T',' ').slice(5,16))}</td>
      <td>${acctChip(acct)} ${esc(dispName(t.strategy))}</td>
      <td class="side-${t.side}">${t.side.toUpperCase()}</td><td>${t.qty} ${esc(t.symbol)}</td>
      <td class="mono" style="font-size:12px">${t.entry_px.toLocaleString()} → ${t.exit_px.toLocaleString()}</td>
      <td style="color:${t.points>0?'var(--green)':t.points<0?'var(--red)':'var(--dim)'}">${t.points>0?'+':''}${t.points}</td>
      <td style="font-weight:650;color:${t.pnl>0?'var(--green)':t.pnl<0?'var(--red)':'var(--dim)'}">${t.pnl==null?`<span class="muted" style="font-weight:500;cursor:help" title="${esc(t.pnl_missing||'no point value for this instrument')}">not priced</span>`:(t.pnl>0?'+':t.pnl<0?'−':'')+fmt$(t.pnl)}</td>
      <td class="muted">${hold}</td></tr>`}).join('');
}
let ACCTS_CONN=false,ACCTS_TS=0;
async function loadAccounts(){
  try{
    const r=await j('/api/accounts');
    ACCTS=r.accounts||[];ACCTS_CONN=!!r.connected;ACCTS_TS=Date.now();WEEK_CLOSED=!!r.week_closed;ACCTS_CONFIGURED=!!r.configured;
    if(SEL!=='__all'&&!ACCTS.some(a=>a.id===SEL))SEL='__all';
    renderSeg();renderAccounts();
  }catch(e){renderAccounts()}
}
function renderSeg(){
  const seg=document.getElementById('acctSeg');
  const total=ACCTS.reduce((s,a)=>a.day_pnl!=null?s+a.day_pnl:s,0);
  const hasP=ACCTS.some(a=>a.day_pnl!=null);
  let html=`<button class="${SEL==='__all'?'on':''}" data-acct="__all">All accounts ${hasP?`<span class="mini ${total<0?'dn':'up'}">${total>0?'+':total<0?'−':''}${fmt$(total)}</span>`:''}</button>`;
  for(const a of ACCTS){
    const short=a.label.split('·').pop().trim();
    html+=`<button class="${SEL===a.id?'on':''}" data-acct="${esc(a.id)}">${esc(short)} ${a.day_pnl!=null?`<span class="mini ${a.day_pnl<0?'dn':'up'}">${a.day_pnl>0?'+':a.day_pnl<0?'−':''}${fmt$(a.day_pnl)}</span>`:''}</button>`;
  }
  seg.innerHTML=html;
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{SEL=b.dataset.acct;renderSeg();renderAccounts();renderEvents();renderBlotter();renderPerf()});
}
function plannerRow(a){
  const g=(a.payout.gates||[]).filter(x=>!x.met);
  const gaps=g.map(x=>x.gap_usd).filter(x=>x!=null);
  return {a, unmet:g.length, gap:gaps.length?Math.min(...gaps):null,
          hold:g.length?g[0].label:null, ready:!!a.payout.ready};
}
function renderPlanner(){
  const el=document.getElementById('payoutPlanner');
  if(!el)return;
  const floor=(BILL.plan==='desk')||BILL.owner_unlocked;
  // Firm arithmetic only: an own-brokerage account has no payout to be close to.
  const rows=ACCTS.filter(a=>a.world!=='own'&&a.payout&&a.payout.entered).map(plannerRow);
  if(!floor||rows.length<3){el.style.display='none';el.innerHTML='';return}
  rows.sort((x,y)=>(y.ready-x.ready)||((x.gap??1e12)-(y.gap??1e12))||(x.unmet-y.unmet));
  el.style.display='';
  el.innerHTML='<div class="sec-title">Payout planner <span class="muted" style="font-weight:400">every account, ranked by distance to a payout</span></div>'
    +'<div class="card" style="padding:0"><table><thead><tr><th></th><th>Account</th><th>Closest blocker</th><th>To clear it</th><th>Rules left</th></tr></thead><tbody>'
    +rows.map((r,i)=>`<tr><td class="mono muted">${i+1}</td><td style="font-weight:550">${esc(r.a.label)}</td>`
      +(r.ready?'<td colspan="3" style="color:var(--green);font-weight:550">Ready - request the payout on your firm\'s page</td>'
      :`<td>${esc(r.hold||'')}</td><td>${r.gap!=null?'$'+Math.round(r.gap).toLocaleString():'not a dollar gap'}</td><td>${r.unmet}</td>`)
      +'</tr>').join('')
    +'</tbody></table></div>'
    +'<div class="muted" style="font-size:12px;margin-top:6px">Your figures, from your firm\'s dashboard - BridgePit only does the arithmetic; the firm\'s own page decides.</div>';
}
function renderAccounts(){
  const el=document.getElementById('acctCards');
  // a rename in progress must not be repainted out from under the customer
  if(el.querySelector('input.nm-edit'))return;
  const shown=SEL==='__all'?ACCTS:ACCTS.filter(a=>a.id===SEL);
  if(!ACCTS.length){
    el.className='grid';
    el.innerHTML=ACCTS_CONN
      ?'<div class="card muted" style="text-align:center;padding:28px">Broker connected - account data is not readable right now (retrying). If this persists, check the connection.</div>'
      :(WEEK_CLOSED&&ACCTS_CONFIGURED?'<div class="card muted brokerHint" style="text-align:center;padding:28px">The futures market is closed for the weekend. Your broker connection resumes by itself Sunday 6 pm New York time - balances and P&L return then.</div>':'<div class="card muted brokerHint" style="text-align:center;padding:28px">Connect a broker to see live per-account P&L. <span class="mono" style="font-size:12px">Connections → Connect</span></div>');
    return;
  }
  renderPlanner();
  // numbers that stopped updating must not keep looking live
  const staleS=ACCTS_TS?Math.round((Date.now()-ACCTS_TS)/1000):null;
  const staleNote=(staleS!=null&&staleS>30)?`<div class="card muted" style="grid-column:1/-1;padding:10px 14px;font-size:12px;color:var(--amber)">account data last updated ${staleS}s ago - retrying</div>`:'';
  el.className='grid '+(shown.length>1?'g2':'');
  // "closest to payout": among accounts with firm figures entered and none
  // already ready, the one with the fewest unmet gates. A label, not a
  // promise - the gates themselves are on the card.
  let closestId=null;
  // …and it must not win "closest to payout" either: it would take the chip
  // and then never render it, so the badge would vanish from the whole screen.
  const entered=ACCTS.filter(x=>x.world!=='own'&&x.payout&&x.payout.entered);
  if(entered.length>1&&!entered.some(x=>x.payout.ready===true)){
    const unmet=x=>(x.payout.gates||[]).filter(g=>g.met!==true).length;
    const gap=x=>(x.payout.gates||[]).filter(g=>g.met!==true)
      .reduce((s,g)=>s+(g.gap_usd==null?Number.POSITIVE_INFINITY:g.gap_usd),0);
    closestId=entered.slice().sort((p,q)=>unmet(p)-unmet(q)||gap(p)-gap(q))[0].id;
  }
  el.innerHTML=staleNote+shown.map(a=>{
    const nStrats=STRATS.filter(s=>s.enabled&&((a.default&&!s.account)||s.account===a.id)).length
      +STRATS.filter(s=>s.enabled&&(s.also_on||[]).some(l=>l.account===a.id&&l.enabled!==false)).length;
    const pos=Object.entries(a.positions||{});
    // THIS account's own limit - its per-account number, else the account
    // default, else honestly "not set". Never an invented figure: this card
    // used to print "firm DLL −$1,100" (the operator's own firm number) on
    // every routed account.
    const lim=a.risk&&a.risk.daily_stop?a.risk.daily_stop:null;
    const used=a.day_pnl!=null?Math.max(0,-a.day_pnl):0;
    const pct=lim?Math.min(100,used/lim*100):0;
    const guard=lim?`auto-halt −$${lim.toLocaleString()}${a.risk.own?' · its own limit':''}`
                   :`no auto-halt set · <a href="#" onclick="go('${a.world==='own'?'own':'funded'}');return false" style="color:var(--accent2)">set one</a>`;
    const hw=haltWord(a.halted);
    const m=a.meta||{};
    let meter='';
    // Everything from here to the payout line is a FIRM's arithmetic: a floor
    // it closes you at, a target it pays out at, the room between them. An
    // own-brokerage account has none of it, and rendering it anyway put a
    // floor-to-target meter directly above the line saying there is no floor.
    const ownAcct=a.world==='own';
    // the honest distance is the HARDEST unmet payout gate, not just the
    // balance line - a 40% consistency rule can put the real target far
    // beyond the payout threshold ... and the tile says so: "To payout",
    // with the gate that binds named under the number.
    let toT=m.to_target, toWhy=(toT!=null)?'balance line':'';
    const unmet=(((a.payout||{}).gates)||[]).filter(g=>!g.met&&g.gap_usd!=null);
    if(unmet.length){
      const hard=unmet.reduce((p,g)=>g.gap_usd>p.gap_usd?g:p);
      if(hard.gap_usd>(toT||0)){toT=hard.gap_usd;toWhy=/^balance/i.test(hard.label||'')?'balance line':String(hard.label||'').toLowerCase();}
    }
    if(!ownAcct&&a.balance!=null&&m.floor!=null&&m.target){
      // the bar ends where a payout becomes possible, the binding gate's
      // balance, never at the firm's balance line alone: a bar that ended at
      // "target $52,600" while To payout said $6,888 read as two targets.
      // The firm's line stays on the bar as a tick.
      const fmb=n=>'$'+Math.round(n).toLocaleString();
      const payBal=Math.max(m.target,a.balance+Math.max(0,toT||0));
      const span=Math.max(1,payBal-m.floor);
      const p=Math.max(0,Math.min(100,(a.balance-m.floor)/span*100));
      const tick=(payBal-m.target>1)?Math.max(0,Math.min(100,(m.target-m.floor)/span*100)):null;
      const tickLab=(tick!=null&&tick>16&&tick<84)?`<span class="tick" style="left:${tick.toFixed(1)}%">firm ${fmb(m.target)}</span>`:'';
      meter=`<div class="range"><i style="left:${p.toFixed(1)}%"></i>${tick!=null?`<em style="left:${tick.toFixed(1)}%" title="the firm's target, ${fmb(m.target)}"></em>`:''}</div>
        <div class="rlabels r2"><span>floor <b>${fmb(m.floor)}</b></span>${tickLab}<span class="pay">payout <b>${fmb(payBal)}</b>${(toWhy&&(toT||0)>0)?` <u>${esc(toWhy)}</u>`:''}</span></div>`;
    }
    const mini=[];
    if(!ownAcct&&m.floor!=null)mini.push(`<div>Min balance<b style="color:var(--amber)">$${m.floor.toLocaleString(undefined,{maximumFractionDigits:0})}</b></div>`);
    if(!ownAcct&&m.room!=null)mini.push(`<div>Room to floor<b style="color:${m.room<500?'var(--red)':m.room<1200?'var(--amber)':'var(--txt)'}">${m.room<0?'−':''}${fmt$(m.room)}</b></div>`);
    if(m.peak_eod!=null)mini.push(`<div>Peak EOD<b>$${m.peak_eod.toLocaleString(undefined,{maximumFractionDigits:0})}</b></div>`);
    // the honest distance is the HARDEST unmet payout gate, not just the
    // balance line - a 40% consistency rule can put the real target far
    // beyond the payout threshold
    if(!ownAcct&&toT!=null)mini.push(`<div>To payout<b style="color:var(--accent2)">${toT>0?fmt$(toT):'HIT 🎉'}</b>${toT>0&&toWhy?`<span class="why">${esc(toWhy)}</span>`:''}</div>`);
    return `<div class="card acct ${a.default?'exec':''}">
      <div class="head">
        <div><div class="nm">${esc(a.label)} <button class="lnk rn" title="Rename this account" onclick="renameAcct('${esc(a.id)}',this)">&#9998;</button></div><div class="aid">${esc(a.id)}</div></div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          ${a.blind?`<span class="pill bad" title="${a.blind} consecutive unreadable P&L reads - ${(a.risk&&(a.risk.daily_stop||a.risk.trail_stop))?"this account's limits are NOT being enforced right now":'nothing can be read for this account (it has no limits set, so nothing is being missed)'}"><span class="dot"></span>risk checks blind</span>`:''}
          ${hw?`<span class="pill bad" title="${esc(String(a.halted))}"><span class="dot"></span>${esc(hw)}</span>`:''}
          ${a.world==='own'?'<span class="acctchip sy" title="Your own broker. No firm rules, no payout gates - its limits are on the My brokerage page.">my brokerage</span>':''}
          <span class="badge ${a.default?'exec':'route'}">${a.default?'execution':(nStrats?`routed ×${nStrats}`:'routed')}</span>
        </div>
      </div>
      ${pnlHtml(a.day_pnl)}${WEEK_CLOSED&&a.day_pnl!=null?'<span class="muted" style="font-size:11.5px;margin-left:8px">Friday\'s session · resets Sunday evening</span>':''}
      <div class="bal">${a.balance!=null?'balance $'+a.balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'balance unavailable'}</div>
      ${sparkline(EQ[a.id],a.balance)}
      ${meter}
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="s">day loss budget ${used>0?fmt$(used):'$0'} used · ${guard}${m.note?' · '+esc(m.note):''}</div>
      ${mini.length?`<div class="mrow">${mini.join('')}</div>`:''}
      ${payoutHtml(a,a.id===closestId)}
      <div class="meta">
        <div>Positions <b>${pos.length?pos.map(([k,v])=>`<span class="poschip">${esc(k)} ${v>0?'+':''}${v}</span>`).join(''):'flat'}</b></div>
        <div>Strategies <b>${nStrats}</b></div>
      </div>
      <div class="acts">
        <button class="btn btn-ghost" onclick="acctHalt('${esc(a.id)}',${a.halted?'false':'true'})">${a.halted?'Resume this account':'Halt this account'}</button>
        ${pos.length?`<button class="btn btn-ghost" style="color:var(--red)" onclick="acctClose('${esc(a.id)}')">Close this account only</button>`:''}
        <span class="quiet">
          <button class="btn-xs" onclick="openAcct('${esc(a.id)}')">${a.world==='own'?'Its own limits':'Limits &amp; firm figures'}</button>
          ${a.world==='own'?'':`<button class="btn-xs" onclick="openSwap('${esc(a.id)}')">Replace account</button>`}
        </span>
      </div>
    </div>`;
  }).join('');
}

// The payout block: HIS firm's rules, our arithmetic, the working shown so
// he can check every line against the firm's own dashboard. If no figures
// are entered, one quiet line invites him to enter them - never a number we
// made up.
// The dashboard re-renders every 2s; without remembering which payout panels
// the customer opened, the re-render slammed them shut before he could read a
// single gate (found by clicking the running screen, 2026-08-14).
const PAYOUT_OPEN=new Set();
function payToggle(el){
  if(el.open)PAYOUT_OPEN.add(el.dataset.pay);else PAYOUT_OPEN.delete(el.dataset.pay);
}
function payoutHtml(a,closest){
  const p=a.payout||{};
  // There is no firm behind an own-brokerage account, so there is no floor to
  // hold, no payout to reach and nothing to invite. Asking for "your firm's
  // figures" here was the funded card leaking onto an account that has none.
  if(a.world==='own')return `<div class="muted" style="margin-top:var(--s3);font-size:var(--t-meta)">Your own account: no firm floor, no payout gates. Its limits are on <a href="#" onclick="go('own');return false" style="color:var(--accent2)">My brokerage</a>.</div>`;
  if(!p.entered)return `<div class="muted" style="margin-top:var(--s3)">Payout readiness: <a href="#" onclick="openAcct('${esc(a.id)}');return false" style="color:var(--accent2)">enter your firm's figures</a> and BridgePit does the arithmetic.</div>`;
  const head=p.ready===true
    ?`<span style="color:var(--green);font-weight:650">ready - every gate you entered is met</span>`
    :p.ready===false
    ?`<span style="color:var(--amber);font-weight:650">held by: ${esc(p.holding||'')}</span>`
    :`<span style="color:var(--dim);font-weight:650">cannot verify: ${esc(p.holding||'')}</span>`;
  const rows=(p.gates||[]).map(g=>{
    const mark=g.met===true?'<span style="color:var(--green)">✓</span>'
      :g.met===false?'<span style="color:var(--red)">✗</span>'
      :'<span style="color:var(--dim)">?</span>';
    return `<div style="display:flex;gap:8px;align-items:baseline;margin-top:var(--s2);font-size:var(--t-meta)"><span style="flex:none">${mark}</span><div><b style="font-size:var(--t-meta)">${esc(g.label)}</b><div class="hint">${esc(g.detail)}</div></div></div>`;
  }).join('');
  return `<details style="margin-top:var(--s3)" data-pay="${esc(a.id)}" ${PAYOUT_OPEN.has(a.id)?'open':''} ontoggle="payToggle(this)">
    <summary style="cursor:pointer;font-size:var(--t-body);list-style:none">Payout ${head}${closest?' <span class="acctchip ev" style="white-space:nowrap" title="fewest unmet gates, then smallest dollar distance">closest to payout</span>':''} <span class="btn-xs" style="margin-left:8px">Details</span></summary>
    ${rows}
    <div class="muted" style="font-size:var(--t-micro);margin-top:var(--s3);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="btn-xs" onclick="openAcct('${esc(a.id)}')">Edit firm figures</button>
      <span>Your figures, from your firm's dashboard. BridgePit only does the arithmetic; the firm's own page decides.</span></div>
  </details>`;
}

// The evening-close tile: which world's close, and nothing at all when no
// world has one. It showed the funded time to every customer, including one
// whose only account is his own and whose close was off.
function eodWorlds(s){
  const by=s.eod_by_world||{}, cnt=s.accounts_by_world||{};
  return ['funded','own'].filter(w=>by[w]&&by[w].enabled&&(cnt[w]===undefined||cnt[w]>0));
}
function paintEodTile(s,note){
  const on=eodWorlds(s), v=document.getElementById('dashEod'), sub=document.getElementById('dashEodS');
  if(!on.length){
    v.innerHTML='<span class="muted" style="font-size:15px">off</span>';
    sub.textContent='no automatic close is switched on';
    return;
  }
  const by=s.eod_by_world||{};
  if(on.length>1&&by.funded.time_et!==by.own.time_et){
    v.innerHTML=`${esc(by.funded.time_et)} <span class="muted" style="font-size:14px">/ ${esc(by.own.time_et)}</span>`;
    sub.textContent=note?('ET · '+note):'ET · funded / brokerage';
    return;
  }
  v.textContent=on.includes('funded')?s.eod_flat_time:by.own.time_et;
  sub.textContent=note?('ET · '+note)
    :('ET · '+(on.length>1?'both worlds':on[0]==='own'?'your brokerage accounts':'your funded accounts'));
}

function haltWord(mk){
  if(!mk)return null;
  if(String(mk).startsWith('watchdog:'))return 'halted - daily stop';
  return {trail:'halted - trail guard',target:'halted - target reached',manual:'halted by you'}[mk]||'halted';
}

async function acctHalt(id,on){
  const a=ACCTS.find(x=>x.id===id)||{};
  if(on&&!confirm(`Halt ${a.label||id}?\n\nIts entries stop; its exits still go through. Your other accounts keep trading. You lift it yourself with Resume.`))return;
  if(!on&&(a.halted==='trail'||a.halted==='target')&&!confirm(`Resume ${a.label||id}?\n\nIt was stopped by its ${a.halted==='trail'?(a.world==='own'?'drawdown stop - the one you set yourself':'trailing guard - it is close to the firm closing it'):'profit target'}. Resume only if that is a decision, not a reflex.`))return;
  try{await j(`/api/accounts/${encodeURIComponent(id)}/halt`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({halt:on})});}
  catch(e){alert((on?'Halt':'Resume')+` FAILED for ${a.label||id} - the request did not go through. Its state is unchanged.`)}
  loadAccounts();refresh();
}

// ---- per-account modal: its own limits + its firm's figures.
// The firm figures are typed by the CUSTOMER from his firm's dashboard. No
// presets, no firm names, no defaults: we own the maths, never the rulebook.
let PA_ID=null,PA_SEQ=0;
function paWarn(list){
  const w=document.getElementById('paWarn');
  if(!list||!list.length){w.style.display='none';w.innerHTML='';return}
  w.style.display='block';
  w.innerHTML=list.map(t=>`<div class="card" style="background:rgba(245,166,35,.07);border-color:rgba(245,166,35,.35);margin:0 0 8px;padding:12px 14px;font-size:13px">⚠︎ ${esc(t)}</div>`).join('');
}
function paErr(m){const e=document.getElementById('paErr');e.style.display=m?'block':'none';e.textContent=m||''}

function renameAcct(id,btn){
  const nm=btn.closest('.nm');const cur=nm.childNodes[0].textContent.trim();
  nm.style.display='none';
  const inp=document.createElement('input');
  inp.className='nm-edit';inp.value=cur;inp.maxLength=40;inp.style.cssText='font:inherit;background:var(--bg);color:var(--txt);border:1px solid var(--line2);border-radius:8px;padding:4px 8px;width:180px';
  nm.parentNode.insertBefore(inp,nm);inp.focus();inp.select();
  let done=false;
  const finish=async(save)=>{
    if(done)return;done=true;
    const val=inp.value.trim();
    inp.remove();nm.style.display='';
    if(!save||!val||val===cur)return;
    try{
      const r=await fetch(`/api/accounts/${encodeURIComponent(id)}/meta`,{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({label:val})});
      if(!r.ok)throw 0;
      loadAccounts();renderSeg&&renderSeg();
    }catch(e){alert('Could not save the name.')}
  };
  inp.onkeydown=e=>{if(e.key==='Enter')finish(true);if(e.key==='Escape')finish(false)};
  inp.onblur=()=>finish(true);
}
function paSaved(on){
  const b=document.getElementById('paSubmit'),l=document.getElementById('acctBg').querySelector('.mfoot .lead');
  if(on){b.textContent='Done';b.onclick=closeAcct;if(l)l.textContent='Saved.'}
  else{b.textContent='Save';b.onclick=saveAcct;if(l)l.textContent='Empty = default. Nothing here is invented for you.'}
}
async function openAcct(id){
  PA_ID=id; paErr(''); paSaved(false);
  // two quick opens raced: the SLOWER /api/risk answer filled the form while
  // PA_ID already pointed at the other account, and Save wrote A's numbers
  // onto B. The sequence token drops any stale answer.
  const my=++PA_SEQ;
  const a=ACCTS.find(x=>x.id===id)||{};
  document.getElementById('paTitle').textContent=(a.label&&a.label!==id)?`${a.label} · ${id}`:id;
  let risk={};
  try{risk=await j('/api/risk')}catch(e){}
  if(my!==PA_SEQ)return;
  const pa=(risk.per_account||{})[id]||{};
  document.getElementById('paDaily').value=pa.daily_stop_usd??'';
  document.getElementById('paTrail').value=pa.floor_buffer_usd??'';
  document.getElementById('paTarget').value=pa.profit_target_balance??'';
  const m=a.meta||{}, p=m.payout||{};
  document.getElementById('paLabel').value=(a.label&&a.label!==id)?a.label:'';
  // a DERIVED floor (computed live from peak − drawdown) must not be offered
  // for saving - writing it back would freeze a trailing floor forever
  document.getElementById('paFloor').value=m.floor_derived?'':(m.floor??'');
  document.getElementById('paPayTarget').value=p.target_balance??(m.target??'');
  document.getElementById('paPayMin').value=p.min_balance??'';
  document.getElementById('paPayDays').value=p.min_days??'';
  document.getElementById('paPayBest').value=p.best_day_max_pct??'';
  document.getElementById('paPayDayMin').value=p.day_min_profit??'';
  document.getElementById('paOvernight').checked=!!a.eod_exempt;
  // An own-brokerage account has no firm, so it is never asked for a firm's
  // figures. The commit that cleaned the CARD left this modal behind, and it
  // was reachable from the My brokerage page itself - the one place the whole
  // point is that there is no firm.
  const own=a.world==='own';
  document.getElementById('paFirmGroup').style.display=own?'none':'';
  document.getElementById('paTitle').textContent+=own?' · your own account':'';
  document.getElementById('paTargetHint').textContent=own
    ?'A take-profit for the account as a whole: at this balance it is closed and halted until you switch it back on.'
    :'Locks in a pass: at this balance the account is closed and halted, so a passed evaluation cannot be traded back down.';
  document.getElementById('paDefaultsHint').innerHTML=own
    ?'Empty fields fall back to <b>My brokerage</b>. If that page is empty too, the guard is simply off - which is a normal way to run your own account.'
    :'Empty fields fall back to <b>Funded accounts</b>. Type <b>off</b> to switch that guard off for this account only.';
  document.getElementById('paOvernightHint').textContent=own
    ?'Only matters if you switched the evening close ON for My brokerage. The kill switch and Close all still flatten this account - an emergency has no exemptions.'
    :'⚠ This account is funded. Skipping the evening close means holding overnight, which most firms forbid. The kill switch and Close all still flatten it.';
  document.getElementById('acctBg').classList.add('show');
}
function closeAcct(){document.getElementById('acctBg').classList.remove('show')}

async function saveAcct(){
  if(!PA_ID)return; paErr('');
  const btn=document.getElementById('paSubmit');btn.disabled=true;
  const v=x=>document.getElementById(x).value.trim();
  try{
    let r=await fetch('/api/risk',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({per_account:{[PA_ID]:{daily_stop_usd:v('paDaily'),
        floor_buffer_usd:v('paTrail'),profit_target_balance:v('paTarget')}}})});
    let d=await r.json();
    if(!r.ok){paErr(d.error||'Could not save the limits.');btn.disabled=false;return}
    const warns=d.warnings||[];
    r=await fetch(`/api/accounts/${encodeURIComponent(PA_ID)}/meta`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({label:v('paLabel'),floor:v('paFloor'),
        eod_exempt:document.getElementById('paOvernight').checked,
        payout:{target_balance:v('paPayTarget'),min_balance:v('paPayMin'),
                min_days:v('paPayDays'),best_day_max_pct:v('paPayBest'),
                day_min_profit:v('paPayDayMin')}})});
    d=await r.json();
    if(!r.ok){paErr(d.error||'Could not save the firm figures.');btn.disabled=false;return}
    const all=warns.concat(d.warnings||[]);
    // A warning shown on a screen the operator has just left is a warning
    // nobody reads. The modal stays open until he has seen it.
    // ... but Save must still feel like Save: the button turns into Done and
    // the footer says saved, so one more click closes it, not Cancel.
    if(all.length){paWarn(all);paSaved(true)}else{closeAcct()}
    loadAccounts();loadWorlds();refresh();
  }catch(e){paErr('Could not reach BridgePit.')}
  btn.disabled=false;
}

// ---- replace a dead account
let SWAP_ID=null;
// The swap's notes used to land on the Settings screen, which the operator is
// never on when he replaces a dead account. They belong on the dashboard he
// is looking at, above the cards.
function swapNotes(list){
  const host=document.getElementById('swapNotes');
  if(!host)return;
  if(!list||!list.length){host.style.display='none';host.innerHTML='';return}
  host.style.display='block';
  host.innerHTML=list.map(t=>`<div class="card" style="background:rgba(245,166,35,.07);border-color:rgba(245,166,35,.35);margin:0 0 8px;padding:12px 14px;font-size:13px">⚠︎ ${esc(t)}</div>`).join('');
}
function swapErr(m){const e=document.getElementById('swapErr');e.style.display=m?'block':'none';e.textContent=m||''}
function openSwap(id){
  SWAP_ID=id;swapErr('');
  const a=ACCTS.find(x=>x.id===id)||{};
  document.getElementById('swapSub').textContent=`Retire ${a.label||id} (${id}) and carry everything it ran onto its replacement.`;
  document.getElementById('swapNew').value='';
  document.getElementById('swapBg').classList.add('show');
  setTimeout(()=>document.getElementById('swapNew').focus(),50);
}
function closeSwap(){document.getElementById('swapBg').classList.remove('show')}
async function doSwap(){
  if(!SWAP_ID)return; swapErr('');
  const nw=document.getElementById('swapNew').value.trim();
  if(!nw){swapErr('Type the new account id.');return}
  const btn=document.getElementById('swapGo');btn.disabled=true;
  try{
    const r=await fetch('/api/accounts/swap',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({old:SWAP_ID,new:nw})});
    const d=await r.json();
    if(!r.ok){swapErr(d.error||'Could not swap.');btn.disabled=false;return}
    closeSwap();
    swapNotes(d.notes||[]);         // what carried, what to go check - impossible to miss
    SEL='__all';
    loadAccounts();loadPerf();refresh();
  }catch(e){swapErr('Could not reach BridgePit.')}
  btn.disabled=false;
}

async function acctClose(id){
  const a=ACCTS.find(x=>x.id===id)||{};
  const pos=Object.entries(a.positions||{}).map(([k,v])=>`${k} ${v>0?'+':''}${v}`).join(', ');
  if(!confirm(`Close every position on ${a.label||id}?\n\n${pos||'(no known positions)'}\n\nOnly this account is closed, at market. Your other accounts are untouched. It is NOT halted - its strategies can open new trades unless you also halt it.`))return;
  // the endpoint answers 200 with ok:false when the broker refused - that is
  // a position still standing, and it must never pass silently
  try{
    const r=await j(`/api/accounts/${encodeURIComponent(id)}/close`,{method:'POST'});
    if(!r||r.ok!==true)throw new Error('unconfirmed');
  }catch(e){
    alert(`Closing ${a.label||id} could NOT be confirmed by the broker - treat its positions as still open and check the account now.`);
  }
  loadAccounts();refresh();
}

// The engine sends the exchange clock as a machine timestamp. Presentation
// only: a person reads "Sat 16 Aug · 05:18 ET", not the year and not seconds
// ticking in the corner of a trading app. Anything unexpected prints as sent.
function setClock(raw){
  const el=document.getElementById('etClock');
  if(!el)return;
  const m=String(raw||'').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?\s*(.*)$/);
  if(!m){el.textContent=raw||'';return}
  const [,y,mo,d,hh,mm,zone]=m;
  const dt=new Date(Number(y),Number(mo)-1,Number(d));
  const day=dt.toLocaleDateString('en-GB',{weekday:'short'});
  const mon=dt.toLocaleDateString('en-GB',{month:'short'});
  el.innerHTML=`${day} ${Number(d)} ${mon}<span class="sep">·</span><b>${hh}:${mm}</b> ${esc(zone||'ET')}`;
}
// Header + System pills. Green only when the book may actually work.
// offline / halt / per-account halt → red. Paid but not live → amber.
// Free paper is the working trial state, not an error. /api/status.connected
// equals mode==='live' (execution_broker is set), so "live && !connected"
// never fires - entitled && not live is the dropped-or-never-armed case.
function statusLight(s, offline){
  if(offline) return {cls:'bad', top:'Offline', dash:'Offline'};
  if(!s || s.halted) return {cls:'bad', top:'Halted', dash:'Halted'};
  const nAH=Object.keys(s.account_halts||{}).length;
  if(nAH){
    const t=nAH+' account'+(nAH>1?'s':'')+' halted';
    return {cls:'bad', top:t, dash:t};
  }
  // The watchers. This light knew about mode, halts and entitlement and nothing
  // about whether the safeties were still running, so it sat green through the
  // whole of the weekend outage the 24-25 Aug audit was written for.
  //
  // AFTER the halt branches on purpose: those are already red, and taking their
  // wording away would change a state that is being reported correctly. BEFORE
  // the amber ones on purpose: "Broker off" says nothing is executing, and this
  // says nothing is being guarded, which is worse.
  //
  // Absence is not a fault - an older engine sends neither field, and the
  // engine already filters blindness that does not matter on this install.
  if((s.guards_stale||[]).length)
    return {cls:'bad', top:'Watcher stopped', dash:'Watcher stopped'};
  if((s.guards_blind||[]).length)
    return {cls:'bad', top:'Watching nothing', dash:'Watching nothing'};
  if(s.entitled && s.mode!=='live') return {cls:'warn', top:'Broker off', dash:'Broker off'};
  if(s.mode==='live') return {cls:'ok', top:'Live', dash:'Running'};
  return {cls:'ok', top:'Paper', dash:'Running'};
}
function paintStatus(s, offline){
  const L=statusLight(s, offline);
  const top=document.getElementById('topStatus');
  const txt=document.getElementById('topStatusText');
  const dash=document.getElementById('dashConn');
  if(top) top.className='pill '+L.cls;
  if(txt) txt.textContent=L.top;
  if(dash) dash.innerHTML=`<span class="pill ${L.cls}"><span class="dot"></span>${L.dash}</span>`;
}
async function refresh(){
  try{
    const s=await j('/api/status');
    const halted=s.halted;
    paintStatus(s, false);
    setClock(s.now_et);
    document.getElementById('dashMode').textContent=(s.mode==='live'?'LIVE · executing':'Paper - nothing reaches a broker')+(s.entitled&&s.mode!=='live'?' · broker off':'');
    // No invented limit. Until the customer sets his own, this tile says so
    // rather than showing a number he never chose (it used to show $1,000,
    // the operator's own firm figure, wrong for everyone else).
    const lim=(s.daily_stop==null||s.daily_stop===0)?null:s.daily_stop;
    const used=s.day_pnl!=null?Math.max(0,-s.day_pnl):0;
    if(lim===null){
      document.getElementById('dashStop').innerHTML=
        `<span class="muted" style="font-size:15px">not set</span>`;
      document.getElementById('dashBar').style.width='0%';
      // Settings has not held this field since the split, and this is the
      // DEFAULT state for a brokerage customer - the one who most needs the
      // link to land somewhere useful.
      const w=(ACCTS.find(x=>x.id===SEL)||{}).world==='own'?'own':'funded';
      document.getElementById('dashLimLine').innerHTML=
        `no automatic halt · <a href="#" onclick="go('${w}');return false" style="color:var(--accent2)">set your daily loss limit</a>`;
    }else{
      document.getElementById('dashStop').innerHTML=used>0
        ?`<span style="color:var(--red)">${fmt$(used)}</span> <span class="muted" style="font-size:14px">of $${lim.toLocaleString()}</span>`
        :`<span style="color:var(--green)">$0</span> <span class="muted" style="font-size:14px">of $${lim.toLocaleString()}</span>`;
      document.getElementById('dashBar').style.width=Math.min(100,used/lim*100)+'%';
      document.getElementById('dashLimLine').textContent=
        `execution account · losses only · auto-halt at −$${lim.toLocaleString()} · profits uncapped`;
    }
    paintEodTile(s);
    const _seg=document.getElementById('acctSeg');if(_seg)_seg.style.display=((typeof ACCTS!=='undefined'&&ACCTS&&ACCTS.length>1))?'':'none';
    if(typeof arrangeDash==='function')arrangeDash();
    // Early-close half-days: the banner says WHY today's flatten time moved.
    const ecb=document.getElementById('earlyCloseBanner'), ect=s.early_close_today;
    if(ect){
      ecb.style.display='block';
      // Whose close, and whether there is one at all. This used to read the
      // funded schedule and invoke "your firm's rule" at a customer who has
      // no firm and whose position nothing was going to close.
      const anyClose=eodWorlds(s).length>0;
      ecb.innerHTML=`<b>Early close today - ${esc(ect.label)}.</b> The market shuts at ${esc(ect.close_et)} ET`+
        (anyClose
          ?`; your ${eodWorlds(s).map(w=>w==='own'?'brokerage':'funded').join(' and ')} accounts are closed automatically at <b>${esc(ect.flatten_et)} ET</b>.`
             +(eodWorlds(s).includes('funded')?` A firm's flat-by-close rule applies on half-days too.`:'')
             +(eodWorlds(s).length===1&&(s.accounts_by_world||{})[eodWorlds(s)[0]==='funded'?'own':'funded']
               ?` Your other accounts are not touched - be flat yourself if you want them flat.`:'')
          :`. <b>No automatic close is switched on</b> - be flat before the close yourself, or the position sits in a closed market until it reopens.`);
      paintEodTile(s,'early close today');
    }else{
      ecb.style.display='none';
    }
    const hu=document.getElementById('hookUrl');
    if(hu&&s.webhook_url)hu.value=s.webhook_url;
    const _hn=document.getElementById('hookLocalNote');if(_hn)_hn.style.display=((s.webhook_url||'').includes('127.0.0.1'))?'block':'none';
    // The token is NOT in /api/status any more - it is the order-entry
    // credential and this poll runs every 2s onto a screen people screenshot.
    // It stays masked until Reveal or Copy asks for it explicitly.
    const pos=Object.entries(s.positions||{});
    document.getElementById('dashPos').textContent=pos.length;
    document.getElementById('dashPosD').textContent=pos.length?pos.map(([k,v])=>k+' '+v).join(', '):'flat';
    const mac=document.getElementById('machineMustRun');
    const awake=document.getElementById('dashAwake');
    const live=s.mode==='live', held=!!s.keep_awake;
    if(awake){
      awake.textContent=held
        ?'Holding awake. Do not close the lid. Quit BridgePit only when you are flat.'
        :'Keep this window open. Closing the lid sleeps the computer.';
    }
    if(mac){
      if(live && !held){
        mac.style.display='block';
        mac.innerHTML='<b>Live, but keep-awake is not running.</b> This Mac may sleep. Alerts and flatten stop. Closing the lid sleeps the computer.';
      }else{
        mac.style.display='none';
        mac.innerHTML='';
      }
    }
    paintStatus(s, false);
    const hb=document.getElementById('dashHalt');
    hb.textContent=halted?'Resume trading':'Halt trading';
    hb.className='btn '+(halted?'btn-green':'btn-red');
    // Resume gets a REAL confirm, worded by why it halted: "manual" is the
    // sticky marker the trail guard and profit target write - one reflex
    // click used to re-arm an account sitting on the firm's drawdown line.
    // Failures are said out loud, never swallowed.
    const mk=s.halt_marker;
    hb.onclick=async()=>{
      if(halted){
        const why=String(mk||'').startsWith('watchdog:')
          ?'The daily loss stop fired. It re-arms itself at 6 pm New York - resuming earlier is overriding your own limit for today.'
          :mk==='manual'
          ?(ACCTS.some(a=>a.world==='own')&&!ACCTS.some(a=>a.world!=='own')
        ?'This halt came from your drawdown stop, your profit target, or a deliberate stop. Those are limits you set yourself.'
        :'This halt came from the trailing guard, the profit target, or a deliberate stop. If it was the trailing guard, a funded account is close to the firm closing it.')
          :'Trading was halted from this dashboard.';
        if(!confirm(`Resume trading?\n\n${why}\n\nOK = entries flow again on the next alert.`))return;
      }
      try{await j('/api/halt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({halt:!halted})})}
      catch(e){alert((halted?'Resume':'Halt')+' FAILED - the request did not reach BridgePit. State unchanged.')}
      refresh();
    };

    STRATS=await j('/api/strategies');
    renderAccounts();renderStrategyCards();
    document.getElementById('stratBody').innerHTML=STRATS.length?STRATS.map(x=>
      `<tr><td style="font-weight:550">${esc(x.name)}${x.name==='My_First_Strategy'?' <span class="tag off" title="Ships with BridgePit so your first test alert has somewhere to land. Rename it or delete it once your own strategies are in.">sample</span>':''}</td><td class="mono">${esc(x.symbol)}</td><td>${x.multiplier}</td>`
      +`<td>${x.protective_stop_pts?esc(String(x.protective_stop_pts))+' pts':'<span class="muted">none</span>'}</td>`
      +`<td>${x.position||0}${(x.also_on||[]).some(l=>l.position)?` <span class="hint">+${(x.also_on||[]).filter(l=>l.position).map(l=>`${l.position} on ${esc(l.account)}`).join(', ')}</span>`:''}</td><td><span class="tag ${x.enabled?'on':'off'}">${x.enabled?'on':'off'}</span>${x.enabled&&(x.also_on||[]).some(l=>l.enabled===false)?` <span class="hint" title="paused in this strategy's account list">${(x.also_on||[]).filter(l=>l.enabled===false).length} account${(x.also_on||[]).filter(l=>l.enabled===false).length>1?'s':''} off</span>`:''}</td>`
      +`<td style="text-align:right">`
      +((x.position||(x.also_on||[]).some(l=>l.position))?`<button class="btn btn-ghost" style="padding:4px 10px;font-size:13px;color:var(--red);margin-right:6px" onclick="closeStrat('${esc(x.name)}')">Close</button>`:'')
      +`<button class="btn btn-ghost" style="padding:4px 10px;font-size:13px" onclick="openStrat('${esc(x.name)}')">Edit</button></td></tr>`).join('')
      :`<tr><td colspan="7" class="muted" style="text-align:center;padding:28px">No strategies yet. Click <b>+ Add strategy</b> - nothing can trade until you do.</td></tr>`;

    loadAlertBlock();
    renderTokenChange();
    LASTEV=await j('/api/events');
    renderEvents();
  }catch(e){paintStatus(null, true)}
}

// A fan-out leg ("Primary__ACCOUNT" in config) is the customer's ONE strategy
// on another account. He never typed that name; no screen may show it raw or
// call it "system". These map a leg back to its primary and its account.
function hidePerfName(n){
  let h=[];try{h=JSON.parse(localStorage.getItem('perfHiddenNames')||'[]')}catch(e){}
  if(!h.includes(n))h.push(n);
  try{localStorage.setItem('perfHiddenNames',JSON.stringify(h))}catch(e){}
  renderStrategyCards();
}
function legInfo(name){
  // match by the parent's own leg list, never by name shape - legacy legs
  // (e.g. _FR suffixes from before the naming scheme) are legs all the same
  if(!name)return null;
  for(const s of STRATS){const l=(s.also_on||[]).find(x=>x.leg===name);if(l)return{primary:s.name,account:l.account}}
  return null;
}
function dispName(name){const li=legInfo(name);return li?li.primary:name}
// which account an event belongs to: explicit account field first, else the
// account its strategy routes to, else it's a system-level event
let LASTEV=[];
function evAcct(e){
  if(e.account&&e.account!=='default')return e.account;
  const s=e.strategy&&STRATS.find(x=>x.name===e.strategy);
  if(s)return s.account||(ACCTS.find(a=>a.default)||{}).id||'__sys';
  const li=e.strategy&&legInfo(e.strategy);
  if(li)return li.account||'__sys';
  return '__sys';
}
function acctChip(id){
  if(!id||id==='__sys')return '<span class="acctchip sy">system</span>';
  const a=ACCTS.find(x=>x.id===id);
  const short=a?a.label.split('·')[0].trim():id.slice(-4);
  return `<span class="acctchip ${a&&a.default?'ev':'ma'}">${esc(short)}</span>`;
}
// Internal plumbing a customer should not have to decode (Gilles, stranger
// run #4: "Activity log shows your plumbing. Watchdog rearm, end-of-day
// checks. Means nothing to a customer."). Hidden by default; the "show
// technical events" toggle brings them back. Anything red/money-relevant
// (fills, orders, halts, trips, failures) is NEVER in this list.
let EV_SHOWALL=false;   // activity shows the last handful; "Show all" flips this
const EV_PLUMBING=new Set(['EODCHECK','WATCHDOG_REARM','WATCHDOG_ON','RECONCILE',
  'CONTRACT','LOG_ROTATED','EARLY_CLOSE_CAL','EOD_HALT',
  'EQUITY_ERR','SNAPSHOT_SEEDED','PEAK_EOD_MIGRATE','CONN_ADD','ALERT_TEST',
  'TOKEN_RETIRED','GUARD_BEAT','STOP_VERIFY_SCHEDULED','GUARD_HEALTH_ERR']);
function showTech(){return localStorage.getItem('bp_showtech')==='1'}
function toggleTech(){localStorage.setItem('bp_showtech',document.getElementById('showTech').checked?'1':'0');renderEvents()}
// Which sentence an event turns into. Lifted out of renderEvents so it can be
// driven directly by test_event_log_renders.js - the `default` arm below dumps
// every field as key=value, which is a fair backstop for a kind nobody
// anticipated and a bad way to deliver "loss limits are not being enforced".
// Eight kinds were reaching it: four added on 24 Aug with the safety fixes and
// four on the 25th with the guard work.
const px=v=>v?Number(v).toLocaleString(undefined,{maximumFractionDigits:2}):'';
// "14400" tells him nothing. "4h" does. Declared as functions rather than
// const arrows so the test can pull them out of THIS file instead of keeping
// its own copy that drifts.
function evDur(s){
  const n=Number(s);
  if(!isFinite(n)||n<=0)return'a moment';
  if(n<90)return`${Math.round(n)}s`;
  if(n<5400)return`${Math.round(n/60)}m`;
  return`${(n/3600).toFixed(1).replace(/\.0$/,'')}h`;
}
function evClock(ts){ return String(ts||'').replace('T',' ').slice(11,16); }
const sideCol=a=>`<span style="color:var(--${String(a).toLowerCase().includes('sell')?'red':'green'});font-weight:700">${esc(String(a).toUpperCase())}</span>`;
function eventDetail(kind, r){
  r=r||{};
  let label=kind, detail='';
  switch(kind){
          case 'RITHMIC_FILL':
            label='FILLED';
            detail=`<span class="evt-main">${r.side?sideCol(r.side)+' ':''}${esc(r.size)} ${esc(r.symbol||'')} @ ${px(r.price)||'?'}</span> <span class="evt-sub">Rithmic-confirmed</span>`;break;
          case 'FILL':
            detail=`<span class="evt-main">${sideCol(r.action)} ${esc(r.qty)}${r.price?' @ '+px(r.price):''}</span> <span class="evt-sub">position ${esc(r.pos_before)} → ${esc(r.pos_after)} (${esc(r.mode||'')})</span>`;break;
          case 'ORDER':
            detail=`<span class="evt-main">${sideCol(r.action)} ${esc(r.qty)} ${esc(r.contract||r.symbol||'')}</span> <span class="evt-sub">→ ${esc(r.account&&r.account!=='default'?r.account:'execution account')} · ${esc(r.broker||'')}</span>`;break;
          case 'REJECT': detail=`<span class="evt-main" style="color:var(--red)">${esc(r.reason||'')}</span>`;break;
          case 'WARN': detail=`<span class="evt-main" style="color:var(--amber)">${esc(r.reason||'')}</span>`;break;
          case 'RECONCILE': detail=`<span class="evt-sub">${esc(r.account||'')} · ${esc(r.positions||'')}</span>`;break;
          case 'WATCHDOG_TRIP': label='LOSS STOP';
            detail=`<span class="evt-main" style="color:var(--red)">${esc(r.trigger||'')}${r.account?' on '+esc(r.account):''} - flattened & halted</span> <span class="evt-sub">${r.day_pnl!=null?`day P&L ${fmtSigned(r.day_pnl)} vs limit ${fmtSigned(r.limit)}`:r.balance!=null?`balance $${Number(r.balance).toLocaleString()}${r.peak_eod?` · peak $${Number(r.peak_eod).toLocaleString()}`:''}${r.target?` · target $${Number(r.target).toLocaleString()}`:''}`:''}</span>`;break;
          case 'PROTECTIVE_STOP_FIRED': label='STOP FIRED';
            detail=`<span class="evt-main" style="color:var(--red)">${esc(r.qty)} closed @ ${esc(r.price)} at the broker</span> <span class="evt-sub">no further exit needed - check why the strategy's own exit never came</span>`;break;
          case 'CLOSE_FAILED': case 'FLATTEN_FAIL': case 'ACCOUNT_FLATTEN_FAIL': case 'EOD_FAIL': case 'EOD_NOT_CLEAN':
            detail=`<span class="evt-main" style="color:var(--red)">${esc(r.reason||r.note||'close/flatten unconfirmed')}${r.account?' · '+esc(r.account):''}</span>`;break;
          case 'CLOSED': detail=`<span class="evt-main">${sideCol(r.action)} ${esc(r.qty)} - closed by hand</span> <span class="evt-sub">${esc(r.reason||'')}</span>`;break;
          case 'ACCOUNT_FLATTENED': detail=`<span class="evt-main">${esc(r.account||'')} closed${(r.closed||[]).length?': '+esc(r.closed.join(', ')):''}</span> <span class="evt-sub">${esc(r.reason||'')} · other accounts untouched</span>`;break;
          case 'ACCOUNT_HALT': detail=`<span class="evt-main" style="color:var(--red)">${esc(r.account||'')} halted - its entries blocked, exits still allowed</span>`;break;
          case 'ACCOUNT_RESUME': detail=`<span class="evt-main">${esc(r.account||'')} resumed${r.was?` <span class="evt-sub">(was ${esc(r.was)})</span>`:''}</span>`;break;
          case 'ACCOUNT_SWAP': detail=`<span class="evt-main">${esc(r.old||'')} → ${esc(r.new||'')}</span> <span class="evt-sub">${(r.strategies||[]).length} strategies carried · peak reset</span>`;break;
          case 'HALT': detail=`<span class="evt-main" style="color:var(--red)">all entries blocked</span> <span class="evt-sub">${esc(r.note||'')}</span>`;break;
          case 'RESUME': detail=`<span class="evt-main">entries flow again</span> <span class="evt-sub">${esc(r.note||'')}</span>`;break;
          case 'EOD_HALT': detail=`<span class="evt-sub">entries blocked until the session roll (end-of-day)</span>`;break;
          case 'REJECT_STALE': case 'REJECT_STALE_EXIT': case 'EOD_PREEMPTED_EXIT':
            detail=`<span class="evt-main" style="color:var(--amber)">${esc(r.reason||'')}</span>`;break;
          case 'WATCHDOG_BLIND': detail=`<span class="evt-main" style="color:var(--red)">${esc(r.account||'')}: ${esc(r.consecutive)} unreadable P&L reads - loss limits NOT enforced there</span> <span class="evt-sub">${esc(r.why||'')}</span>`;break;
          // --- 1.4.4's detection, Gilles' item (b) for 1.4.5 -----------------
    case 'GAP': label='DOWNTIME';
      // `asleep` and `down` are different problems: one is a lid he closed,
      // the other is a process that was not running. Saying "downtime" for
      // both would hide the one he can do something about.
      detail=`<span class="evt-main" style="color:var(--amber)">BridgePit was not listening for ${evDur(r.seconds)}${r.cause==='asleep'?' - the Mac was asleep':r.cause==='down'?' - the app was not running':''}</span> <span class="evt-sub">${esc(evClock(r.from))} to ${esc(evClock(r.to))} ET · any TradingView alert in that window is gone, it was never received</span>`;break;
    case 'FUNNEL_DOWN': label='UNREACHABLE';
      detail=`<span class="evt-main" style="color:var(--red)">TradingView could not reach this Mac</span> <span class="evt-sub">${esc(r.why||'')}${r.probes?` · ${esc(r.probes)} failed probes`:''}${r.since?` · since ${esc(evClock(r.since))} ET`:''}</span>`;break;
    case 'FUNNEL_UP': label='REACHABLE';
      // NOT an all-clear. Same two shapes as funnel.up_sentence(): a clean
      // outage lost everything in the window; a flap lost only the gaps, and
      // saying "any alert in that window never arrived" is a lie (08-25: a
      // real fill landed in the middle of four drops).
      if((Number(r.drops)||1)>1){
        detail=`<span class="evt-main" style="color:var(--amber)">BridgePit is up. This Mac can receive signals again (dropped ${esc(r.drops)} times over ${evDur(r.seconds)})</span> <span class="evt-sub">${esc(evClock(r.from))} to ${esc(evClock(r.to))} ET · entries, exits, and the end-of-day flatten can come through</span>`;
      }else{
        detail=`<span class="evt-main" style="color:var(--amber)">BridgePit is up. This Mac can receive signals again after ${evDur(r.seconds)}</span> <span class="evt-sub">${r.to?`back at ${esc(evClock(r.to))} ET · `:''}entries, exits, and the end-of-day flatten can come through</span>`;
      }
      break;
    case 'FUNNEL_BLIP':
      // healed inside the strike window. Logged and never alerted, on purpose:
      // a light that cries wolf is ignored on the day it is right.
      detail=`<span class="evt-sub">the public address blipped for ${evDur(r.seconds)} and recovered before the outage threshold, so no warning was raised - a signal arriving in that window would still have been missed</span>`;break;
    case 'NOTIFY_FLUSH': label='ALERTS SENT';
      detail=`<span class="evt-main">${esc(r.sent==null?0:r.sent)} held alert${r.sent===1?'':'s'} delivered after the outage</span> <span class="evt-sub">${r.expired?`${esc(r.expired)} ${r.expired===1?'was':'were'} too old to send · `:''}${esc(r.left==null?0:r.left)} still waiting</span>`;break;
    // --- the safety fixes of 24 Aug ------------------------------------
    case 'WATCHDOG_NO_BALANCE': label='NO BALANCE';
      // deliberately NOT the WATCHDOG_BLIND wording: the daily stop reads
      // day P&L and is STILL enforcing here. Only the guards that need a
      // balance have stopped, and saying otherwise would be a false alarm.
      detail=`<span class="evt-main" style="color:var(--amber)">${esc(r.account||'this account')}: the broker is not reporting a balance${r.consecutive!=null?` (${esc(r.consecutive)} reads)`:''} - the trailing drawdown and profit target are NOT enforcing</span> <span class="evt-sub">the daily stop still is</span>`;break;
    // --- the protective stop's three states (09-06): placed, resting, missing.
    // These rendered as raw key=value on the dashboard until now; the one line a
    // customer most wants to read ("is my stop at the broker?") was the least readable.
    case 'FLATTEN_ALL': label='FLATTENED';
      detail=`<span class="evt-main">every open position closed${r.broker?' at '+esc(r.broker):''}</span> <span class="evt-sub">${esc(r.reason||'')}${r.attempt&&r.attempt>1?' · attempt '+esc(r.attempt):''}</span>`;break;
    case 'PROTECTIVE_STOP_SET': label='STOP PLACED';
      detail=`<span class="evt-main">stop ${px(r.trigger)||esc(r.trigger)} on ${esc(r.qty)} ${esc(r.contract||'')}</span> <span class="evt-sub">sent to the broker · read-back in ~20s</span>`;break;
    case 'PROTECTIVE_STOP_VERIFIED': label='STOP RESTING';
      detail=`<span class="evt-main" style="color:var(--green)">stop ${px(r.trigger)||esc(r.trigger)} on ${esc(r.contract||'')} is working at the broker</span> <span class="evt-sub">${esc(r.account||'')}${r.status?' · '+esc(r.status):''} · holds whether this Mac is awake or not</span>`;break;
    case 'PROTECTIVE_STOP_MISSING': label='STOP MISSING';
      detail=`<span class="evt-main" style="color:var(--red)">the broker accepted the stop at ${px(r.trigger)||esc(r.trigger)} but it is NOT resting</span> <span class="evt-sub">${esc(r.account||'')} · check the position by hand</span>`;break;
    case 'PROTECTIVE_STOP_KEPT': label='STOP KEPT';
      detail=`<span class="evt-main" style="color:var(--amber)">a resting protective stop was left in place${r.account?' on '+esc(r.account):''} rather than cancelled</span> <span class="evt-sub">${esc(r.why||'unknown is not flat')}${r.oid?' · order '+esc(r.oid):''} - check your working orders</span>`;break;
    case 'STATE_MISSING': label='BOOK LOST';
      detail=`<span class="evt-main" style="color:var(--red)">started with an EMPTY position book on a machine that has run before</span> <span class="evt-sub">any position you are holding is no longer tracked, and peak_eod is gone - check the account against your broker before trading</span>`;break;
    case 'CONNECT_RETRY': label='RETRYING';
      detail=`<span class="evt-main">still trying to connect${(r.pending||[]).length?': '+esc(r.pending.join(', ')):''}</span> <span class="evt-sub">${r.again_in_s!=null?'next attempt in '+esc(r.again_in_s)+'s':'will keep retrying'}</span>`;break;
    // --- the guard work of 25 Aug -------------------------------------
    case 'GUARD_BLIND': label='WATCHING NOTHING';
      detail=`<span class="evt-main" style="color:var(--red)">the ${esc(r.guard||'')} watcher is running with nothing to watch</span> <span class="evt-sub">${esc(r.why||'')} - it cannot go stale, so every other light stays green</span>`;break;
    case 'GUARD_BLIND_OVER': label='WATCHING AGAIN';
      detail=`<span class="evt-main">the ${esc(r.guard||'')} watcher has something to watch once more</span>`;break;
    case 'GUARD_STALE': label='WATCHER STOPPED';
      detail=`<span class="evt-main" style="color:var(--red)">the ${esc(r.guard||'')} watcher has gone silent${r.silent_s!=null?' for '+esc(r.silent_s)+'s':''}</span> <span class="evt-sub">the daily stop and the end-of-day close may not be running - restart BridgePit</span>`;break;
    case 'GUARD_STALE_OVER': label='WATCHER BACK';
      detail=`<span class="evt-main">the ${esc(r.guard||'')} watcher is completing passes once more</span>`;break;
    case 'GUARD_HEALTH_ERR':
      detail=`<span class="evt-sub">${esc(r.err||'')}</span>`;break;
    case 'WATCHDOG_REARM': detail=`<span class="evt-main">daily stop re-armed${r.account?' on '+esc(r.account):''} - new session</span>`;break;
          case 'CONNECTED': case 'CONN_UP': detail=`<span class="evt-main">account ${esc(r.account||'')}</span>`;break;
          case 'CONN_DOWN': detail=`<span class="evt-main" style="color:var(--red)">broker session lost - auto-reconnect</span>`;break;
          case 'CONTRACT': detail=`<span class="evt-sub">${esc(r.symbol)} → ${esc(r.resolved)} (${esc(r.exchange)})</span>`;break;
          case 'EOD_DONE': detail=`<span class="evt-main">flattened: ${esc((r.closed||[]).join?r.closed.join(', '):r.closed)}</span> <span class="evt-sub">${esc(r.reason||'')}</span>`;break;
          case 'WATCHDOG_ON': detail=`<span class="evt-sub">daily stop $${esc(r.daily_stop)} · trail $${esc(r.trail_stop)} · poll ${esc(r.poll_s)}s</span>`;break;
          default: detail=`<span class="mono muted" style="font-size:12px">${Object.entries(r).map(([k,v])=>`${k}=${esc(JSON.stringify(v))}`).join('  ')}</span>`;
        }
  return {label, detail};
}
function renderEvents(){
    const cb=document.getElementById('showTech');if(cb)cb.checked=showTech();
    let ev=SEL==='__all'?LASTEV:LASTEV.filter(e=>{const a=evAcct(e);return a===SEL||a==='__sys'});
    if(!showTech())ev=ev.filter(e=>!EV_PLUMBING.has(e.kind));
    if(!ev.length){document.getElementById('logBody').innerHTML='<tr><td colspan="4" class="muted" style="padding:24px;text-align:center">No activity yet</td></tr>';return}
    // the last handful, not the whole history - promoted during setup it had
    // become the biggest thing on the screen (part 3, #6)
    const EV_CAP=6, total=ev.length;
    const shown=EV_SHOWALL?ev:ev.slice(0,EV_CAP);
    document.getElementById('logBody').innerHTML=shown.map(e=>{
      const {ts,kind,strategy,...r}=e;const t=(ts||'').replace('T',' ').slice(11,19);
      const {label, detail}=eventDetail(kind, r);
      return `<tr><td class="mono muted">${esc(t)}</td><td class="kind k-${esc(kind)}">${esc(label)}</td><td>${acctChip(evAcct(e))} ${esc(dispName(strategy||''))}</td><td style="font-size:12px">${detail}</td></tr>`;
    }).join('')+(total>EV_CAP?`<tr><td colspan="4" style="text-align:center;padding:10px"><a style="cursor:pointer;font-size:13px;color:var(--dim)" onclick="EV_SHOWALL=!EV_SHOWALL;renderEvents()">${EV_SHOWALL?'Show fewer':'Show all '+total}</a></td></tr>`:'');
}
