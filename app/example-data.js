(function(root){
  'use strict';
  const A='50K-01', B='100K-02', STRATEGY='breakout-1m', ENTRY=23412.25;
  const HISTORY_A=[50000,50120,50070,50410,50320,50810,50660,51100,51400,51800];
  const HISTORY_B=[100000,100220,100040,100150];
  const durations={dashboard:8,execution:10,limits:9};
  // Quarter-point marks, with an uneven market cadence. The last mark is
  // the first mark, so looping introduces no artificial balance reset.
  const marks=[[0,12],[.28,14],[.55,10],[.86,18],[1.2,23],[1.52,19],[1.88,7],[2.24,-4],[2.63,-18],[2.97,-31],[3.32,-36],[3.64,-29],[3.95,-18],[4.32,-6],[4.66,3],[5.02,17],[5.35,24],[5.7,30],[6.05,22],[6.44,17],[6.8,13],[7.13,8],[7.5,12]];
  function payout(balance,target,days){
    const gap=Math.max(0,target-balance), unmet=[];
    if(gap)unmet.push('Balance');if(days<10)unmet.push('Trading days');
    return {entered:true,ready:!unmet.length,holding:unmet.join(' + '),gates:[
      {label:'Balance a payout needs',met:!gap,gap_usd:gap,detail:`balance $${balance.toLocaleString()} of $${target.toLocaleString()}${gap?' — $'+gap.toLocaleString()+' to go':''}`},
      {label:'Trading days a payout needs',met:days>=10,detail:`${days} of 10 days — counted from recorded sessions`}
    ]};
  }
  function account(id,label,base,realized,qty,delta,limit,floor,target,days,position){
    const unrealized=position?delta*2*qty:0, day_pnl=realized+unrealized, balance=base+day_pnl;
    return {id,label,default:id===A,world:'funded',day_pnl,balance,positions:position?{MNQU6:qty}:{},halted:false,
      risk:{daily_stop:limit,own:id===B},meta:{floor,target,room:balance-floor,to_target:Math.max(0,target-balance),peak_eod:id===B?100220:base},
      payout:payout(balance,target,days),example:{starting_balance:base,realized,unrealized,mark:ENTRY+delta,entry:ENTRY,quantity:qty,point_value:2}};
  }
  function event(ts,kind,extra={}){return {ts:'2026-09-03T'+ts+'-04:00',kind,strategy:STRATEGY,account:A,...extra};}
  function snapshot(scene,time){
    const t=Math.max(0,Math.min(durations[scene]||8,Number(time)||0));
    const execution=scene==='execution', delta=execution?0:scene==='dashboard'?marks.filter(m=>m[0]<=t).at(-1)[1]:12;
    const position=execution?t>=1.45:true;
    const accounts=[account(A,'Funded 50K',51800,120,2,delta,600,50100,52600,10,position),account(B,'Eval 100K',100150,-210,3,delta,1000,97600,102600,4,execution?t>=1.65:true)];
    const strategy={name:STRATEGY,symbol:'MNQ1!',multiplier:2,protective_stop_pts:50,enabled:true,account:A,position:position?2:0,
      also_on:[{account:B,leg:STRATEGY+'__'+B,multiplier:3,protective_stop_pts:75,enabled:true,position:execution?(t>=1.65?3:0):3}]};
    // Both routed books exist; the native account filter selects the first
    // account in the execution excerpt.
    let events=[event('09:47:11','ORDER',{action:'BUY',qty:2,contract:'MNQU6',broker:'RITHMIC'}),
      event('09:47:12','RITHMIC_FILL',{side:'BUY',size:2,symbol:'MNQU6',price:ENTRY}),
      event('09:47:13','PROTECTIVE_STOP_SET',{trigger:ENTRY-50,qty:2,contract:'MNQU6'}),
      event('09:47:15','REJECT',{reason:'burst duplicate within 10s'}),
      event('09:47:33','PROTECTIVE_STOP_VERIFIED',{trigger:ENTRY-50,contract:'MNQU6',status:'working'})];
    const moments=[.65,1.45,2.35,3.5,7.1];
    const other=events.filter(e=>e.kind!=='REJECT').map(e=>({...e,account:B,strategy:STRATEGY+'__'+B,...(e.qty?{qty:3}:{}),...(e.size?{size:3}:{}),...(e.trigger?{trigger:ENTRY-75}:{})}));
    const otherMoments=[.85,1.65,2.6,7.35];
    if(execution){events=events.filter((_,i)=>t>=moments[i]);events.push(...other.filter((_,i)=>t>=otherMoments[i]));}
    else events.push(...other);
    events.sort((a,b)=>a.ts.localeCompare(b.ts));
    const rules={daily_stop_usd:600,floor_buffer_usd:200,halt_scope:'account',eod:{enabled:true,time_et:'16:05'}};
    return {scene,t,accounts,strategies:[strategy],events:events.reverse(),
      status:{mode:'live',connected:true,entitled:true,halted:false,account_halts:{},guards_stale:[],guards_blind:[],keep_awake:true,
        now_et:execution?'2026-09-03 09:47:'+String(t>=7.1?33:t>=3.5?15:t>=2.35?13:t>=1.45?12:t>=.65?11:10)+' ET':'2026-09-03 09:48:'+String(Math.floor(t)).padStart(2,'0')+' ET',day_pnl:accounts[0].day_pnl,daily_stop:600,
        positions:position?{[STRATEGY]:2,...(accounts[1].positions.MNQU6?{[STRATEGY+'__'+B]:3}:{})}:{},
        eod_flat_time:'16:05',eod_by_world:{funded:{enabled:true,time_et:'16:05'},own:{enabled:false,time_et:'16:05'}},accounts_by_world:{funded:2,own:0}},
      worlds:{funded:{world:'funded',rules,connections:[{label:'Rithmic',broker:'Rithmic',status:'connected'}],accounts:accounts.map(a=>({...a,connection:'Rithmic',own_numbers:a.id===B}))},
        own:{world:'own',rules:{daily_stop_usd:0,floor_buffer_usd:0,eod:{enabled:false,time_et:'16:05'}},accounts:[],connections:[]}},
      equity:{[A]:HISTORY_A.map((balance,i)=>({date:['2026-08-20','2026-08-21','2026-08-24','2026-08-25','2026-08-26','2026-08-27','2026-08-28','2026-08-31','2026-09-01','2026-09-02'][i],balance})),[B]:HISTORY_B.map((balance,i)=>({date:['2026-08-28','2026-08-31','2026-09-01','2026-09-02'][i],balance}))},
      trades:{trips:[{ts_close:'2026-09-03T09:36:00-04:00',strategy:STRATEGY,account:A,side:'long',qty:2,symbol:'MNQU6',entry_px:23362.25,exit_px:23392.25,points:30,pnl:120,hold_min:14},
        {ts_close:'2026-09-03T09:36:00-04:00',strategy:STRATEGY+'__'+B,account:B,side:'long',qty:3,symbol:'MNQU6',entry_px:23427.25,exit_px:23392.25,points:-35,pnl:-210,hold_min:14}],strategies:{}},
      billing:{plan:'multi',status:'active',billing_enabled:true}};
  }
  const api={snapshot,accountIds:[A,B],entry:ENTRY,durations};
  root.BridgePitExample=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
