Setup guide · Start on paper

# Your first alert.
A paper fill on your Mac.

Four stages, one clear finish. Keep Connections empty: this first setup needs no broker, BridgePit licence or card.

[01 Open BridgePit](#install) · [02 Choose a strategy](#strategy) · [03 Set up the address](#address) · [04 See a paper fill](#verify)

Have ready: an Apple Silicon Mac, your TradingView strategy, and a TradingView plan with webhook alerts. Enable [TradingView two-factor authentication](https://www.tradingview.com/support/solutions/43000572460-how-to-configure-2fa/) first. Keep this Mac awake and online throughout the test.

01

On your Mac

## Open BridgePit.

- [Download the Mac app](https://bridgepit.com/downloads/BridgePit-mac.dmg). Open the DMG, drag BridgePit into Applications, then launch it.

- Create your dashboard password: at least eight characters. The dashboard opens in your browser at 127.0.0.1:8787.

Ready when You can see the dashboard in Paper mode, with no broker connections.

### Installation or password help

If macOS refuses to open the app, use a fresh download from BridgePit and keep the exact error for support. There can be several causes; a chat download is not the only one.

Forgot your password? Use Forgot it? on the password screen and follow the local recovery instructions. There is no recovery email.

Port 8787 already in use? Quit an older BridgePit through its own Settings if one is running. Otherwise contact support with the error; do not close an unidentified program or change ports by guesswork.

02

In BridgePit → Strategies

## Choose what the alert runs.

- If My_First_Strategy is already listed, edit it; otherwise use + Add strategy. This is an alert destination, not a supplied trading strategy.

- Select the instrument you intend to test. Leave Contracts per signal at 1 for an initial one-contract signal. Keep the strategy Switched on and save.

For this first test, use a TradingView strategy whose entry from flat sends one contract. Strategies with larger entries, partial exits or pyramiding need a sizing review first. [See how sizing works](#sizing).

Ready when Your enabled strategy and intended instrument appear in Strategies.

### My instrument is missing

In Strategies → Instruments → + Add instrument, search for it and select the matching result. Check TradingView symbol, Contract root and Exchange, then press Save and select it in your strategy.

Use the contract root without a month or year, such as MNQ. BridgePit resolves the current contract. If the instrument is not in the search results, confirm its mapping and broker support before adding it manually.

### Optional: check the paper engine immediately

Open Settings → Alert setup, select your strategy and use Send a test signal. Review any pause or safety message it shows.

This is a local check. It does not prove that TradingView or your public address works. Continue below for that.

03

Tailscale → BridgePit → TradingView

## Let TradingView reach your Mac.

Tailscale Funnel lets TradingView reach BridgePit on this Mac. You keep your broker connection on your own machine.

- [Install Tailscale for Mac](https://tailscale.com/download/mac), sign in, and complete its VPN and system-extension approvals. Choose a plan appropriate to your use; its Personal plan is for non-commercial use.

- In BridgePit, open Settings → Your public address. Choose Check again, then Set up public address. If asked, choose Approve with Tailscale, complete its approval page, return to BridgePit and check again. Keep other Tailscale serving settings unchanged during setup.

- Wait for Your public address is ready: BridgePit has saved the address and checked the public path. Use the manual help below for an older app or an existing tunnel conflict.

Address ready BridgePit has saved your public address and checked the path. Create your strategy's alert next.

### Manual setup, older app or Tailscale permissions

For BridgePit 1.4.19, or if assisted setup is unavailable, open the manual setup area under Your public address (the commands are shown directly in older versions). Review any existing Tailscale Serve/Funnel configuration first; a Funnel command can replace a route or make other routes on that port public. Copy the command shown by BridgePit into Terminal and run it. It normally reads tailscale funnel --bg 8787. Follow any Tailscale approval link, then run it again. Paste the returned HTTPS address into Your public address and press Save; BridgePit adds /webhook. Use Check the path before continuing.

If Terminal cannot find tailscale, try the bundled command below, using the port shown in BridgePit:

```
/Applications/Tailscale.app/Contents/MacOS/Tailscale funnel --bg 8787
```

Funnel needs MagicDNS, HTTPS and Funnel permission in your Tailscale network. Follow its approval prompts; a managed network may require its administrator. For version-specific macOS prompts, use [Tailscale's system-extension instructions](https://tailscale.com/docs/concepts/macos-sysext).

tailscale funnel status reports the saved serving configuration. BridgePit's Check the path also tests reachability; a connected Tailscale app alone does not prove it.

### Alert message reference

Use the message prepared by Alert setup in the app. Copy block fills your strategy name and token; the supplied SMA strategy includes the same message automatically. This example is for reference only; its name and token are placeholders.

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

Two clocks, two jobs: bar_time identifies the bar for duplicate checks; fired_at checks entry freshness. Preserve both placeholders. Keep your token private. Never add broker credentials to the alert.

The app's strategy name need not be the TradingView script title: the copied message must match the name saved in BridgePit. The instrument and account are selected in BridgePit, not taken from the chart. BridgePit submits market orders.

Moving from PickMyTrade requires your new BridgePit URL and message. The compatible BridgePit path /v2/add-trade-data does not transfer a PickMyTrade hostname or make its old message compatible.

04

TradingView → BridgePit dashboard

## See the alert arrive and fill.

- Keep Connections empty and check the dashboard is in Paper mode. If you deliberately paused entries, allow them again. Review any safety warning before resuming.

- In Settings → Alert setup, select the strategy saved in BridgePit and choose your setup below. Use your intended chart's symbol and timeframe. Pause an old alert before replacing it to avoid duplicate trades.

### Supplied 14/28 SMA strategy: automatic confirmation

In BridgePit 1.4.23, choose Supplied 14/28 SMA strategy · automatic confirmation and Copy strategy. Save it as a new private Pine script in TradingView and add it to your chart. Keep the code private: it includes your alert token. Preserve your strategy's Properties and start on paper. This complete strategy is only for the supplied 14/28 SMA crossover, not an add-on for other code.

Create one strategy alert with Order fills and alert() function calls. Keep the prefilled Message. Under Notifications, enable Webhook URL and paste the address using Copy webhook URL in BridgePit. Check expiration and notification schedule, then create it.

Keep BridgePit and Tailscale running. On a realtime market update, this alert sends a harmless confirmation automatically. Look for Setup confirmation received and its time under Alert setup. No temporary message or separate test alert is needed. A closed market can delay the update. This receipt proves message delivery for that setup; it does not verify order fills or future availability.

### My existing strategy: use its order-fill alert

Choose My existing strategy · copy its alert message and Copy block. In TradingView, create an alert on your chart's strategy with Order fills only and paste that block into Message. Under Notifications, enable Webhook URL and paste the URL from BridgePit → Settings → Your webhook → Copy. Check expiration and notification schedule, then create it.

Existing or protected strategies do not gain automatic confirmation from a webhook URL alone. They need compatible code from their creator, or their next real order-fill event. Do not replace your strategy with the SMA example just to test its connection.

When your strategy next fills an order in real time, match that event and its Webhook status in TradingView's alert log to the FILL marked (paper) under BridgePit's Recent activity. Check the strategy, action, size and time. Backtest trades do not send these alerts.

Paper setup complete A real strategy event has produced the matching simulated fill. A setup confirmation alone does not complete this step.

You can continue on paper for free. Observe your strategy's entries, exits and sizing before broker execution. If you change its TradingView inputs, script, symbol or timeframe, recreate its alert so the saved copy uses those changes.

### No confirmation or strategy fill?

Start with TradingView's alert log. No event: check the strategy, market hours, expiration and notification schedule. For automatic confirmation, include alert() function calls and keep On realtime bar tick in the supplied strategy's Properties. Its order decisions remain at candle close. A saved alert keeps its own copy of the script and settings; editing the chart does not update that copy.

Failed webhook: check its public address. No receipt in BridgePit: read the setup status. A changed address or alert token requires updated code and a replacement alert. Pine sends the startup confirmation once per running script instance; it does not automatically resend after failed delivery. A quiet strategy may still need time for a real trade. Do not change its logic to force one. If BridgePit rejects a trade, use its precise reason below.

For a separate delivery diagnostic, open Settings → Optional diagnostic: send a separate price alert → Prepare connection test. This tests a different message and is optional. The local Send a test signal and public-path Send a test alert the long way round both start on this Mac. Neither establishes that your TradingView strategy alert is configured correctly.

When your paper setup is working

## Broker execution comes next.

Connecting a broker is a separate stage. Even in Paper mode, enabled account protection or closing actions can affect connected accounts. Review the account's rules before connecting.

### Set up broker execution

- Confirm eligibility. For the current Rithmic route, confirm with your broker or firm that your account permits BridgePit's R | Protocol API connection and automation, and confirm access fees. Do not assume an ordinary demo login is eligible.

- Configure the account's rules. Use Funded accounts for firm accounts or My brokerage for your own. Set the Daily stop you intend to use, review End of day, then press Save my limits. Blank loss limits provide no protection.

- Connect deliberately. In Connections → + Add connection, select the correct account type and Rithmic system, enter your credentials, then Save & Connect. Confirm the returned account. Check firm figures and any per-account overrides on its dashboard card. In Strategies, check the account, instrument and size assigned to each strategy.

- Prove notifications. Configure Telegram or email under Settings → Where we reach you. In Alert delivery, use Send test message and confirm I received it only after it arrives. Read and acknowledge What BridgePit depends on.

- Activate and arm. If you have a licence key, use Subscription → Activate. Broker entries require valid paid access, the eligible connection, the safety acknowledgements and Set as execution. Read any refusal; the connection colour alone is not execution approval.

Drawdown stop means a buffer above the account's floor. It is not a loss measured down from the highest balance. On a funded account's dashboard card, open Limits & firm figures. Enter the firm's current minimum balance in Balance the firm closes it at and save. Confirm the displayed floor matches the firm's dashboard; keep a manually entered floor current when the firm changes it. The stop needs a usable floor. For example, a floor of $48,000 and buffer of $500 gives a $48,500 stop threshold. These are illustrative figures, not a recommended setting.

End of day is separate for each account type. Funded accounts default to enabled at 15:55 New York time; My brokerage defaults to off. Enabled closes can act on connected accounts without entry execution being armed or paid access being active. Half-days can move the close earlier. Check the displayed schedule and account exceptions.

BridgePit must be awake and connected to act on its limits. Verify positions and protective orders directly with your broker; software limits do not guarantee a maximum loss.

### Connect Telegram or email notifications

Open Settings → Where we reach you. Enable at least one channel and press its section's Save after filling the fields.

Telegram: follow the instructions beside Bot token and Chat ID to create your bot and find the destination. Send your own bot a message once so it can reply to you. Keep its token private.

Email: enter Send alerts to, Sending account, the provider's App password and Mail server details. Use the provider's supported SMTP settings; do not assume your normal mailbox password works. If the provider does not allow this connection method, choose another supported sender or Telegram.

Then use Settings → Alert delivery → Send test message. Check the intended inbox or Telegram chat and press I received it only after seeing the message. If delivery fails, fix the displayed error before arming broker execution.

Reference

## Help when you need it.

### Contracts per signal and Emergency stop

Contracts per signal currently both multiplies the alert quantity and caps the resulting absolute position. From flat, an alert for one contract with a setting of three produces three. An alert for two with a setting of one is rejected: it would exceed the cap. Raising the setting does not fix a larger entry from flat, because it raises the multiplier too.

This is why the first test uses a one-contract entry. Check full entry, exit and reversal sequences on paper; do not change a working strategy's trading logic just to clear an error. Larger entries, pyramiding and partial exits require a compatibility review.

Emergency stop is optional, in points; blank means no configured emergency stop. For broker execution, verify that a protective order is actually resting at the broker. Where native stops are unavailable, the app uses local enforcement and reports it. Local protection stops when the Mac or connection stops. Even a broker-held stop-market order can fill beyond its trigger price.

### Alert errors

bad token / unknown strategy

In BridgePit, select the intended strategy under Alert setup and copy a fresh block into the alert's Message.

qty <= 0 / unfilled placeholders

Use a strategy order-fill alert, with the copied message. A price or indicator alert does not supply the strategy placeholders.

position cap

Check the sizing explanation above, the alert quantity and the current paper position.

duplicate / late entry

Read the precise rejection. Keep bar_time as {{time}} and fired_at as {{timenow}}. Do not remove the clocks to get around a rejection.

this alert carries no bar_time / two clocks are swapped

Use a fresh Copy block from the app. Keep bar_time as {{time}} and fired_at as {{timenow}}.

/halt does nothing

Check the app is running, Telegram is connected and you replied YES to its confirmation within 60 seconds. Check broker positions directly if an urgent action is unconfirmed.

nothing in Recent activity

Start with TradingView's alert log: did it trigger, and what was the Webhook status? Then check the public address in BridgePit.

broker connection or execution refused

Read the current error and readiness details. For an app-permission refusal, firm authorisation or a previous open session can be involved. A green connection card records connection status; it is not an independent live heartbeat.

### Restarting, connection loss and Telegram

Keep BridgePit and Tailscale running during trading hours. Enable Tailscale's launch-at-login option if appropriate. BridgePit does not start itself after a reboot. Open it yourself, or add BridgePit under macOS System Settings → General → Login Items. Check the public path before relying on alerts. Funnel started with --bg persists and resumes when Tailscale runs again; do not treat a saved URL as evidence of availability.

TradingView retries certain server failures, but does not guarantee delivery. BridgePit monitors the saved public address in the background, with the dashboard open or closed. Its own warnings also depend on this Mac and a working notification route. Broker-held orders may still execute when this Mac is offline.

Telegram /halt blocks new entries; /flatten requests closing open positions; /resume allows entries again. Confirm those actions with YES within 60 seconds. /path checks the public route. Silence can mean a stopped app, network problem or notification problem; it does not identify the cause. Email can warn you but cannot perform these commands.

Still stuck? [support@bridgepit.com](mailto:support@bridgepit.com). Include the step, exact error and matching activity row. Omit tokens, passwords and licence keys.

[Download this guide as text](bridgepit-setup-guide.md)
