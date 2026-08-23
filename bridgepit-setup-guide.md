# BridgePit setup guide - plain-text version

This is the complete BridgePit setup guide in plain text, made to be pasted
into any AI assistant so it can walk you through setup step by step and
answer questions in your own words. It is the same content as
https://bridgepit.com/setup, with extra detail.

Support: support@bridgepit.com - read directly by the two people who built
BridgePit, spread across European and Asian hours. We answer fast.

## What BridgePit is

BridgePit is desktop software (macOS today, Apple Silicon; Windows in
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

1. Your computer - the Mac app is ready today (M1 or newer); Windows is on
   its way. Use the machine you normally trade from. It must stay on, lid
   open, and connected to the internet during your trading hours (that is
   what "executes from your own IP" means). No internet, nothing trades.
2. TradingView on a plan with webhook alerts (Essential and up).
3. A futures prop account at a firm that supports Rithmic, with API access
   enabled. Your firm charges its own API-access fee, paid to the firm
   directly. (No CME market-data license needed - BridgePit is order-only.)
4. Tailscale, a free app used once in step 2 - tailscale.com/download.
5. Your BridgePit license key if you have subscribed (arrives by email
   after checkout). Not needed for paper trading.

## Step 1 - Install BridgePit

Download the Mac app from https://bridgepit.com (BridgePit-mac.dmg - signed
and notarized by Apple). Open the file, drag BridgePit into Applications,
launch it. Your browser opens the dashboard at 127.0.0.1:8787 - that
address means "this computer": the dashboard, your settings, and your
credentials answer only on your machine.

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

Troubleshooting this step: run "tailscale funnel status" in Terminal. It
should say "Funnel on" and list your address. Note that Tailscale can show
itself as connected while the public address serves nothing - connected and
serving are two different things, so trust this command, not the app's
status.

## Step 3 - Connect your broker

In the dashboard: Connections → + Add connection. Pick your broker, enter
the login your broker or prop firm gave you, then Save & Connect. The
status pill turns green when connected. Your first connection becomes the
execution account automatically.

Your credentials are encrypted on your machine with a key that never
leaves it, used only to open your broker session. They never touch
BridgePit's servers.

## Step 4 - Add your strategy, wire the TradingView alert

In the dashboard, open Strategies and add your strategy. The name is the
handshake - your TradingView alert must send exactly the same name (case
and spaces count). The size multiplier is a hard cap on how large this
strategy may ever get; it is enforced before any order leaves.

In TradingView, create an alert on your strategy and set two fields:

- Webhook URL: your address from step 2 (ending in /webhook).
- Message: the JSON template below. You only edit the marked values:
  your strategy name, your token (in its two spots), your connection name
  from step 3, and your account id.

```
{
  "strategy_name": "Breakout-1m",
  "symbol": "{{ticker}}",
  "data": "{{strategy.order.action}}",
  "quantity": "{{strategy.order.contracts}}",
  "price": "{{close}}",
  "date": "now",
  "order_type": "MKT",
  "token": "your-token-from-settings",
  "multiple_accounts": [{
    "token": "your-token-from-settings",
    "connection_name": "RITHMIC1",
    "account_id": "your-account-id",
    "quantity_multiplier": 1
  }]
}
```

The {{...}} placeholders are TradingView's own variables - leave them
exactly as written; TradingView fills them when the alert fires.

Migrating from PickMyTrade: your existing alert format works unchanged -
point your alerts at your new address ending in /v2/add-trade-data instead.
Switching is one URL edit per alert.

## Step 5 - Test on paper, then go live

Trigger your alert once (or use TradingView's alert test). Watch the
dashboard's Recent activity: a FILL row with your strategy's name means the
whole chain works - TradingView reached your machine, your machine
simulated the order. The free tier is paper-only, so nothing can touch a
real account during testing.

Going live: paste the license key from your purchase email under
Subscription → Activate. Live execution requires both the green broker
connection and the active subscription.

Before your first live session: open Settings → Risk controls and set the
daily loss stop to your firm's daily limit or tighter. The end-of-day
flatten (15:55 ET default), per-strategy caps, duplicate rejection, and
the dashboard kill-switch are already on.

## Troubleshooting

- "bad token" - the token in your alert message does not match Settings.
  Re-copy it into BOTH places it appears in the message.
- "unknown strategy" - the alert's strategy_name does not exactly match a
  strategy added in the app. Case and spaces count.
- "REJECT - burst duplicate" - working as intended: the same signal arrived
  twice within seconds and the copy was refused.
- Nothing appears at all - TradingView cannot reach your machine. Run
  "tailscale funnel status", and check the URL ends in /webhook.
- Fills still say "(paper)" after subscribing - live needs a green
  connection AND an activated key; check both on the dashboard.
- Internet drops mid-position - BridgePit reconnects continuously and
  alerts you by email/Telegram; the end-of-day flatten retries until your
  account is confirmed flat.

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
