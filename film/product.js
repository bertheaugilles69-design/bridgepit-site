const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const px=v=>v?Number(v).toLocaleString('en-US',{maximumFractionDigits:2}):'';
const sideCol=a=>'<span class="side '+(String(a).toLowerCase().includes('sell')?'sell':'buy')+'">'+esc(String(a).toUpperCase())+'</span>';
const fmtSigned=v=>(v>=0?'+':'−')+'$'+Math.abs(Number(v)||0).toLocaleString('en-US');
const fmt$=v=>'$'+Math.abs(Number(v)||0).toLocaleString('en-US');
function evDur(s){
  const n=Number(s);
  if(!isFinite(n)||n<=0)return'a moment';
  if(n<90)return`${Math.round(n)}s`;
  if(n<5400)return`${Math.round(n/60)}m`;
  return`${(n/3600).toFixed(1).replace(/\.0$/,'')}h`;
}
function evClock(ts){ return String(ts||'').replace('T',' ').slice(11,16); }
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