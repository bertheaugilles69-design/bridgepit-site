# BridgePit setup guide - plain-text version

This is the complete BridgePit setup guide in plain text, made to be pasted
into any AI assistant so it can walk you through setup step by step and
answer questions in your own words. It is the same content as
https://bridgepit.com/setup, with extra detail.

Support: support@bridgepit.com - read directly by the two people who built
BridgePit, spread across European and Asian hours. We answer fast.

## What BridgePit is

BridgePit is desktop software (macOS today, Apple Silicon; a Windows version is
progress) that executes TradingView strategy alerts on your own futures
broker account, locally from your own computer and IP address. No cloud
middleman: your broker credentials are encrypted on your machine and never
touch BridgePit's servers. It is semi-automated by design - it executes,
you supervise. Built-in rails: kill-switch, per-strategy position caps,
duplicate-alert rejection and end-of-day auto-flatten (15:55 ET by
default, configurable) are on from the start; the daily loss stop is
the one number you enter yourself.

Free tier: paper trading only, no card needed - orders are simulated.
Going live requires BOTH a connected broker account AND an active
subscription. Paper is free now. Live is $49/mo (1 account) when it is on
sale; Multi is coming. Until a live subscription exists, everything stays
on paper by design.

## What you need before starting

1. Your computer - the Mac app is ready today (M1 or newer); a Windows version is planned. It runs on
   its way. Use the machine you normally trade from. It must stay on, lid
   open, and connected to the internet during your trading hours (that is
   what "executes from your own IP" means). No internet, nothing trades.
2. TradingView on a plan with webhook alerts (Essential and up).
3. A Rithmic futures account - a funded prop account or your own broker,
   as long as it is on Rithmic, with API access enabled. They charge their
   own API-access fee, paid to them directly. Your Rithmic account also
   needs a paid subscription with them: demo and trial Rithmic logins
   cannot connect at all. (As we read it, no CME market-data licence is needed - BridgePit is
   order-only, your charts stay on TradingView.)
4. Tailscale, a free app used once in step 2 - tailscale.com/download.
5. Your BridgePit license key if you have subscribed (arrives by email
   after checkout). Not needed for paper trading.
6. A Telegram account, or an e-mail app password. BridgePit will not let a
   connection go live until you have proved it can reach you - see "Before
   your first live session" below.

## Step 1 - Install BridgePit

Download the Mac app from https://bridgepit.com/downloads/BridgePit-mac.dmg
(signed and notarized by Apple). Open the file, drag BridgePit into
Applications, launch it. Your browser opens at 127.0.0.1:8787 - that address
means "this computer": the dashboard, your settings, and your credentials
answer only on your machine.

The first screen asks you to set a password for the dashboard, at least 8
characters. Pick one you will keep: there is no account behind it and no
recovery e-mail. If you lose it, the only way back in is deleting the app's
auth.json by hand.

If BridgePit says it cannot start because another program is using port
8787: close that program - if it is an older copy of BridgePit, quit it
from its own Settings page - or move BridgePit to another port and use the
new one everywhere in this guide.

## Step 2 - Give your machine an address TradingView can find

Why: TradingView sends alerts from the internet; your computer, on purpose,
cannot be found from the internet. Tailscale Funnel gives it one public
address, for one door, once.

1. Install Tailscale and sign in (Google or Apple login; the free personal
   plan is enough).
2. Answer the two macOS questions - the second one properly. macOS asks to
   add a VPN configuration: click Allow. Then it says Tailscale "would like
   to use a new network extension" and offers OK or Open System Settings.
   Click Open System Settings, find Tailscale, and switch it on. Clicking OK
   turns nothing on and gives no error - Tailscale then sits half-installed.
3. Open Terminal: press Cmd-Space, type "Terminal", press return.
4. Paste this one line and press return:

   tailscale funnel --bg 8787

   It prints your public address, e.g.

   https://your-mac.tail1234.ts.net/
   |-- proxy http://127.0.0.1:8787

   (yours shows your own machine's name). You can close Terminal; you never
   need to type it again.

   First run on a new account usually prints a link instead, like
   https://login.tailscale.com/f/funnel?node=... That is normal: Funnel is
   off until you switch it on. Open the link, approve it, then run the same
   line again - the second run gives the address.

   If Terminal says "command not found: tailscale", use the long form:
   /Applications/Tailscale.app/Contents/MacOS/Tailscale funnel --bg 8787

Your webhook URL is that address plus /webhook. The app also shows the
finished URL and your secret token, both with copy buttons, under
Settings → Your webhook.

Safety note: through the public address, BridgePit answers ONLY the alert
endpoint, and every alert must carry your secret token. The dashboard,
settings, and broker credentials answer only on your machine - enforced in
the app itself, not just by the tunnel.

A saved address is not a live one. Your line is saved for good and you
never type it again, but the address only answers while Tailscale is
running and serving it - and a Mac that has restarted comes back with
neither Tailscale nor BridgePit running until you log in and start them.
TradingView fires each alert once and never retries, so an alert sent to a
dead address is simply gone, and the one you can least afford to lose is an
exit. BridgePit re-tests the address in the background, dashboard open or
closed. When it stops answering, the top of the dashboard says so. Once you
are live and Telegram or email is on, a real outage also reaches your
phone. In Tailscale's settings, switch on "Launch Tailscale at login".
BridgePit does not start itself: after a reboot, open it, or add it in
System Settings → General → Login Items.

Troubleshooting this step: run "tailscale funnel status" in Terminal. It
should say "Funnel on" and list your address. Note that Tailscale can show
itself as connected while the public address serves nothing - connected and
serving are two different things, so trust this command, not the app's
status.

## Step 3 - Connect your broker

In the dashboard: Connections → + Add connection. Enter the Rithmic login
your broker or prop firm gave you - Rithmic is the broker BridgePit
connects to today - then Save & Connect. The status pill turns green when
connected.

Your orders stay on paper until you click "Set as execution" on the
connection card. That click is deliberate and it is the one that makes
fills real. A connection can sit green and connected for days without ever
placing a live order.

The green pill records your last successful login, not a live heartbeat.
If the broker link drops later the pill can still read Connected -
BridgePit tells you through your alerts and writes a CONN_DOWN row in
Recent activity, so trust those over the pill.

Two things to sort out with your firm first, because neither is ours to
switch on. They have to enable Rithmic API access for your account, and
they charge their own fee for it, paid to them and not to us. And your
Rithmic account needs a paid subscription with them: demo and trial
Rithmic logins cannot connect at all. Some firms also have to whitelist
BridgePit itself on their Rithmic system, separately from your login - if
your first connection is refused on permissions, that is what it means,
and your password is not the problem.

Your credentials are encrypted on your machine with a key that never
leaves it, used only to open your broker session. They never touch
BridgePit's servers.

## Step 4 - Add your strategy, wire the TradingView alert

In the dashboard, open Strategies and add your strategy. The name is the
handshake - your TradingView alert must send exactly the same name (case
and spaces count).

"Contracts per signal" is your size, and it MULTIPLIES. BridgePit takes the
contract count in the alert and multiplies it by this number: a 1-lot
signal at 3 sends 3 contracts. It also refuses any order that would take
the net position above it. Leave it at 1 unless you deliberately want to
scale, and if your TradingView strategy already trades more than one
contract, leave it at 1 or the two multiply and the order is refused. Do
NOT set it to your firm's maximum as a safety ceiling - that is the
opposite of what it does.

Emergency stop is optional, in points. Leave it blank and there is none.
Put a number and every fill rests a real stop at the broker that many
points away, so a closed lid or a dropped line still has a cap. The line
under the field is that distance in dollars. This is the rail the lid
and a dead internet cannot take with them.

Don't type the alert message. Open Settings → Alert setup, pick your
strategy, and press "Copy block". Your token is already in it, so there is
nothing to fill in and nothing to mistype.

In TradingView, create an alert. Set its Condition to your strategy itself,
not the indicator or the symbol - {{strategy.order.action}} and
{{strategy.order.contracts}} only fill in when the condition is the
strategy, and otherwise every alert is refused with "qty <= 0". Then:

- Message: click the row, clear it, paste the block.
- Notifications: click the row, switch on Webhook URL, paste your address
  from step 2 (ending in /webhook).

Copy this into TradingView's Message box. Change two lines only:
strategy_name is the name you typed in the app, not the chart and not
the script title. token is the one in Settings → Your webhook. Leave
every {{...}} exactly as written.

```
{
  "strategy_name": "YourStrategyName",
  "data": "{{strategy.order.action}}",
  "quantity": "{{strategy.order.contracts}}",
  "price": "{{close}}",
  "bar_time": "{{time}}",
  "fired_at": "{{timenow}}",
  "token": "YOUR-TOKEN"
}
```

Two clocks, two jobs. bar_time must be {{time}} (the bar's time) so the
same signal cannot fill twice. fired_at must be {{timenow}} (the moment
the alert fired) so a late entry is refused. Do not swap them: {{time}}
in fired_at would refuse every entry on a 5-minute chart, because the
bar is already minutes old the instant it fires.

Nothing about accounts belongs in this message. Which account a strategy
trades is set in the app, under the strategy's Account field, with "Also
run this strategy on" for more. BridgePit also trades the instrument you
picked on the strategy, not the chart the alert fired from, and always at
market.

Migrating from PickMyTrade: /v2/add-trade-data still answers, so the URL
can stay. The message cannot. Do not keep the PickMyTrade body. Add
"strategy_name" matching the strategy you added in the app, because
BridgePit routes by strategy and not by symbol, and swap in your BridgePit
token. Easiest path is Copy block above - it writes both, plus the two
clocks. Keep the old body and the alert is refused.

## Step 5 - Test on paper, then go live

Trigger your alert once - or use BridgePit's own "Send a test signal"
button under Settings → Alert setup, which needs no TradingView at all.
Watch the dashboard's Recent activity: a FILL row with your strategy's name
means the whole chain works - TradingView reached your machine, your
machine simulated the order.

No order from your alerts can reach a real account until you press "Set as
execution" on a connection. Until then every fill is paper, by design.

One thing does reach a connected account regardless: the end-of-day
flatten. From 15:55 ET it cancels working orders and closes positions on
any broker session BridgePit is connected to - subscription or not,
execution or not - because an unpaid bill must never leave a position open
overnight. If you are also trading that account by hand, disconnect it here
or switch the end-of-day flatten off before you paper-test.

Going live: paste the license key from your purchase email under
Subscription → Activate. Live execution requires the active subscription, a
green broker connection, AND the "Set as execution" click on that
connection - fills stay on paper without it.

BridgePit will not let you go live until you have proved it can reach you.
Clicking "Set as execution" is refused, with the reason, until both of
these are done:

  1. In Settings → Where we reach you, set up Telegram or e-mail. Then in
     Settings → Alert delivery, click "Send test message", and once it
     arrives click "I received it".
  2. In Settings → What BridgePit depends on, click "Read the list", then
     "I have read this".

This is deliberate: a program that places your orders while you are away is
no use if it cannot tell you something went wrong.

Telegram is also the kill switch. Once it is on, you can text the bot from
your phone. /path checks whether TradingView can reach this Mac right now.
/halt blocks new entries - exits and the end-of-day flatten still run.
/flatten closes every open position at market. /resume turns entries back
on. Halt, flatten and resume ask you to reply YES within 60 seconds. Only
the chat you saved answers; anyone else gets silence. If /path does not
answer, this Mac is asleep - that is the same as unreachable. Email can
warn you. It cannot halt.

Before your first live session: open Settings → Your risk limits and set
BOTH numbers that ship blank - the Daily stop ("Stop for today after losing
$...") at your firm's daily limit or tighter, and the Drawdown stop, how
far below your best balance you will let the account fall. A blank limit is
no limit, and for a funded account the trailing drawdown is the rule that
ends it. The end-of-day flatten (15:55 ET default), the per-strategy
contract ceiling, duplicate rejection, and the dashboard kill-switch are
already on.

## Troubleshooting

- "bad token" - the token in your alert message does not match Settings →
  Your webhook. Copy it from there again, or use "Copy block" under Alert
  setup, which fills it in for you.
- "qty <= 0" - the alert carried no contract count.
  {{strategy.order.contracts}} only fills in when the alert's Condition is
  your strategy itself, not the indicator or the symbol. Re-create the
  alert with the strategy as the condition.
- "unknown strategy" - the alert's strategy_name does not exactly match a
  strategy added in the app. Case and spaces count.
- "REJECT - burst duplicate" - working as intended: the same signal arrived
  twice within seconds and the copy was refused.
- "this alert carries no bar_time" - the message is missing
  "bar_time": "{{time}}". Duplicate protection is then only a few seconds.
  Use Copy block - it writes both clocks.
- Every entry refused on a 5-minute chart - the two clocks are swapped.
  bar_time must be {{time}} (the bar). fired_at must be {{timenow}} (the
  fire). Copy block writes them in the right place.
- Nothing appears at all - TradingView cannot reach your machine. Run
  "tailscale funnel status", and check the URL ends in /webhook.
- Fills still say "(paper)" after subscribing - almost always the missing
  click: open Connections and press "Set as execution" on your connection.
  Live needs that, a green connection, AND an activated key.
- "Set as execution" is refused - you have not proved BridgePit can reach
  you yet. Set up Telegram or e-mail under Settings → Where we reach you,
  send the test message and confirm it arrived, then read the dependency
  list. The refusal names which one is missing.
- /halt does nothing - Telegram is not set up, or the bot token was
  refused. Settings → Where we reach you: send the test message, then try
  /halt again. It will ask for YES. Email cannot halt.
- "Rithmic refused this app for your account" - not a password problem.
  Your firm has to enable BridgePit on their Rithmic system for your login;
  ask them to whitelist it. (Or a previous session is still open: wait a
  minute and reconnect.)
- The pill says Connected but nothing fills - the pill shows your last
  successful login, not a live link. Look for a CONN_DOWN row in Recent
  activity, and trust your e-mail or Telegram alert over the pill.
- Internet drops mid-position - BridgePit reconnects continuously and
  alerts you by email/Telegram; once reconnected, the end-of-day flatten
  keeps asking the broker until it confirms you are flat, and raises the
  alarm if it cannot by the cutoff.

## The one habit that matters

BridgePit executes; you supervise. Keep the machine on, lid open, and on
the internet during your trading hours. Glance at the dashboard like you
would glance at a position. Quit only when you are flat. No internet,
nothing trades. Rules differ by prop firm and change - always check your
firm's current policy yourself.

## Support

support@bridgepit.com - no ticket system, no bots. Include what you
clicked, what you expected, what happened instead, and the matching row
from Recent activity if there is one. Account or license problems (key
never arrived, billing looks wrong): same address, include the email you
purchased with.
