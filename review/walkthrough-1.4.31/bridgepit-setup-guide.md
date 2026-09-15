# BridgePit 1.4.31 setup guide

Setup guide · Start on paper

# Your first alert.
A paper fill on your Mac.

Four stages, one clear finish. Keep Connections empty: this first setup needs no broker, BridgePit licence or card.

[01 Open BridgePit](#install) · [02 Choose a strategy](#strategy) · [03 Set up the address](#address) · [04 See a paper fill](#verify)

Have ready: an Apple Silicon Mac, your TradingView strategy, and a paid TradingView plan (Essential or higher) with two-factor authentication switched on; the free plan cannot send webhook alerts. Enable [TradingView two-factor authentication](https://www.tradingview.com/support/solutions/43000572460-how-to-configure-2fa/) first. Keep this Mac awake and online throughout the test.

01

On your Mac

## Open BridgePit.

- [Download the Mac app](https://bridgepit.com/downloads/BridgePit-mac-1.4.31.dmg). Open the DMG, drag BridgePit into Applications, then launch it.

- Create your dashboard password: at least eight characters. The dashboard opens in your browser at 127.0.0.1:8787.

The left sidebar has Connections: your broker list. Leave it empty for this whole paper test. Fills are simulated on this Mac; no broker is involved.

Ready when You can see the dashboard in Paper mode, and Connections is empty.

### Installation or password help

If macOS refuses to open the app, use a fresh download from BridgePit and keep the exact error for support. There can be several causes; a chat download is not the only one.

Forgot your password? Use Forgot it? on the password screen and follow the local recovery instructions. There is no recovery email.

Port 8787 already in use? Quit an older BridgePit through its own Settings if one is running. Otherwise contact support with the error; do not close an unidentified program or change ports by guesswork.

02

In BridgePit → Strategies

## Choose what the alert runs.

- Open Strategies in BridgePit's left sidebar. If My_First_Strategy is already listed there, edit it; otherwise use + Add strategy. This is an alert destination, not a supplied trading strategy.

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

Tailscale Funnel provides the public address TradingView needs to deliver alerts to this Mac, including paper alerts. You can use BridgePit's local paper test without it, but that does not test TradingView delivery. You keep your broker connection on your own machine.

A separate account: Tailscale is a separate service, not a BridgePit account or a subscription bundled with BridgePit. Funnel is available on all Tailscale plans; the free Personal plan is for non-commercial use. Check [Tailscale's current plans](https://tailscale.com/pricing) for your intended use before signing up. Do not assume trading use qualifies for Personal.

### A. Install Tailscale and allow it to run

1. [Install Tailscale for Mac](https://tailscale.com/download/mac). Choose the Standalone download, open its installer and complete installation. If this Mac already has Tailscale, open the existing app instead; do not install a second variant.
2. Tailscale's own setup window normally opens by itself as soon as installation finishes, starting with a welcome screen. If it does not appear, open Finder → Applications → Tailscale. Continue from the welcome screen. The dots along the bottom of the window mark your progress through the three screens below.
3. Whenever macOS asks for a password on these screens, use the login password for this Mac's user account, not your BridgePit dashboard or Tailscale password. In a virtual Mac, that means the virtual Mac's password, which can differ from the physical Mac's.

Tailscale screen: Required permissions (REQUIRED)

Grant both rows. These approvals allow Tailscale to run; they do not sign you in. Next stays grey until both rows show Granted.

4. System extension. Click Grant permissions. macOS opens System Settings at its extensions list; if it does not, open System Settings → General → Login Items & Extensions yourself. On macOS 15 or later, choose Network Extensions ⓘ, turn on Tailscale Network Extension, approve with Touch ID or this Mac's password, then choose Done. On macOS 14 or earlier, open Privacy & Security instead, find the message that system software from Tailscale.app was blocked from loading, and choose Allow. Return to the Tailscale window: the row changes from System Extension Approval Required to Granted.
5. VPN Configuration. When macOS asks whether Tailscale may add VPN configurations, choose Allow. This row may already show Granted, because that prompt can appear before the extension approval.

Ready when: both rows show Granted with a green tick and Next is available. Click Next.

The extension still says Approval Required? Return to System Settings and check that the Tailscale Network Extension switch is on and was approved with this Mac's password. If macOS shows that Tailscale was blocked, choose Allow. Then go back to the Tailscale window; it updates by itself. Do not disable macOS security or unrelated extensions. See [Tailscale's illustrated approval instructions](https://tailscale.com/docs/concepts/macos-sysext) for your macOS version.

Tailscale screen: Quality of life settings (OPTIONAL)

Neither switch is required, and either choice is fine for this paper test. You can change both later in Tailscale's settings.

6. Start at login, off by default. On means Tailscale starts by itself whenever this Mac restarts, so your public address comes back without you opening Tailscale. Worth turning on before you rely on alerts. BridgePit does not start itself after a restart; see Restarting under Help below.
7. Receive connectivity alerts, on by default. Lets Tailscale show macOS notifications about its own connection. Leave it as you prefer, then click Next.

Ready when: the window shows Join a tailnet. Installation and permissions are complete; nothing is signed in yet. Continue with B.

### B. Sign in and connect this Mac

Tailscale screen: Join a tailnet (REQUIRED)

This screen is the account sign-in, separate from installing and from the permissions you just granted. Status: Not connected and an empty Tailnet are normal here. A tailnet is your Tailscale network; this Mac joins it only after you sign in and authorize it.

8. Click Sign in to your network. With no Tailscale account yet, use Sign up under the button instead. Your browser opens Tailscale's sign-in page; use the account for your intended network, with the plan note above in mind.
9. In the browser, complete the sign-in, then the device connection/authorization page for this Mac. Signing into the website alone does not connect the app. A managed network may also need its administrator to approve this device.
10. Return to Tailscale. Confirm Connected and the intended account/network, shown when you click the Tailscale dots icon in the Mac's top-right menu bar. Finish any remaining setup screen, then return to BridgePit.

Closed the setup window, or nothing happens when you click Sign in to your network? Click the Tailscale dots icon in the Mac's top-right menu bar, then Log in…. It opens the same browser sign-in.

Tailscale ready: The Tailscale menu shows Connected to your intended network. An installer success screen, “You're all set”, Join a tailnet, Not connected or Needs Authentication does not establish this checkpoint.

### Sign in does nothing, or BridgePit cannot check Tailscale?

No browser opens: try Log in… from the Tailscale menu-bar icon, rather than the setup window. If nothing opens there either, confirm both rows on Required permissions show Granted. During a new setup with no trading or other active work on this Mac, save your work and restart this Mac once. Reopen BridgePit and Tailscale from Applications, then retry the menu-bar login. In a virtual Mac, restart only the virtual Mac. A restart is a recovery step, not proof that setup succeeded.

The browser opens but does not load: try a normal website in the same browser on the same Mac. If that also fails, resolve that Mac's internet connection first. Do not change an existing VPN or DNS configuration by guesswork.

Tailscale says Connected, but BridgePit cannot read a valid reply: leave Tailscale connected. In Settings → Your public address, open connection help and use Copy check details. This result does not mean Tailscale is missing or switched off. Do not reinstall it, delete its account data or run Funnel commands to fix an unreadable check.

If the checkpoint still cannot be reached, stop here and keep the exact message and macOS/Tailscale versions for [Tailscale troubleshooting](https://tailscale.com/docs/install/mac#troubleshooting) or BridgePit support. Do not share passwords, tokens or private login links.

### C. Set up BridgePit's public address

After any restart of this Mac, open Tailscale from Applications first. Its icon must be in the menu bar and show Connected. When Tailscale is not running, BridgePit's check says Finish setup in Tailscale and offers Open Tailscale.

1. In BridgePit, open Settings → Your public address and choose Check again. If it says Finish setup in Tailscale, click Open Tailscale, wait until the Tailscale menu-bar icon shows Connected, then Check again. Continue only when it shows Tailscale connected and offers Set up public address. If it cannot finish the check, use the help above rather than starting over.
2. Choose Set up public address. If asked, choose Approve with Tailscale: your browser opens Tailscale's approval page, which ends with Tailscale Funnel is ready to use. You can now close this window. Close it, return to BridgePit and choose I approved, check again. Keep other Tailscale serving settings unchanged during setup.
3. BridgePit now shows your address and usually The address is not reachable yet. That is normal for a new address: wait a minute or two, then choose Check and save address. Repeat once if needed. If the address already existed, Check and save address verifies and saves it. An existing tunnel conflict needs review, not an automatic reset.

Address ready BridgePit has saved your public address and checked the path. BridgePit's ready box offers Continue to Alert setup; section 04 starts there. The optional delivery diagnostic further down that page is not part of this guide.

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

BridgePit → Settings → Alert setup, then TradingView

## See the alert arrive and fill.

One question decides your path. Do you already have a TradingView strategy of your own? No: use the supplied 14/28 SMA strategy, the recommended first test. Yes: use your own strategy's order-fill alert. Both paths start the same way.

Start here only when: section 03 C ended with Address ready: Settings → Your public address shows Your public address is ready. Until then, Alert setup's Copy strategy, Download .pine and Copy webhook URL stay grey, with a note under them that says what is missing and offers Open Your public address. If you see that note, finish 03 C first, then continue here.

1. On the Dashboard, check Paper simulation and that Connections is still empty. New entries must say Allowed. If it says Paused, click Allow paper entries: after 15:55 ET the end-of-day close pauses entries until the next session, and a paper fill is refused while paused.
2. Open Settings → Alert setup. Under 1. Strategy saved in BridgePit, pick the strategy you created in section 02.
3. Under 2. Do you already have your own TradingView strategy?, choose your answer. The matching steps appear below it, and here.

Path A. No strategy of your own yet: Supplied 14/28 SMA strategy

This is a complete strategy for the supplied 14/28 SMA crossover, not an add-on for other code. It includes your alert token, so keep the script private. Use 1 contract in TradingView; set your account size in BridgePit. Start on paper.

4. Click Copy strategy. Grey, with a note under it? Do what the note says, usually finishing section 03 C, then click again.
5. In TradingView, open a 1-minute chart of the instrument you chose in section 02 (timeframe menu at the top of the chart). On a 1-minute chart the first paper fill usually comes within an hour of market time; a 5-minute chart can take hours. Click Pine Editor at the bottom of the chart. Replace its contents with the copied code, Save it as a private script under any file name, then Add to chart. On the chart it appears as BridgePit 14/28 SMA for your strategy's name.
6. On the chart, click Alert (the clock icon). The Create alert dialog opens. Under Condition pick BridgePit 14/28 SMA for your strategy's name (the script's title, not the file name you saved), then Order fills and alert() function calls. Keep the prefilled Message. Open Notifications, switch on Webhook URL, and paste the address from BridgePit's Copy webhook URL. Check expiration and notification schedule, then click Create.
7. Back in BridgePit, open Settings → Alert setup. The box under the steps is the receipt: it proves TradingView reaches this Mac before any trade. It arrives on the next price tick after you created the alert, usually within a few minutes while the market is open, and changes to Setup confirmation received with a time. Outside market hours it waits for the next tick.

Ready when: Alert setup shows Setup confirmation received. This proves TradingView reaches this Mac. It does not place a trade and does not verify fills yet.

Path B. Your own TradingView strategy

4. Click Copy block. This is your alert message; it includes your token.
5. In TradingView, on your strategy's chart, click Alert (the clock icon). The Create alert dialog opens. Condition: your strategy, Order fills only. Replace Message with the copied block.
6. Open Notifications, switch on Webhook URL, and paste the address from Settings → Your webhook → Copy in BridgePit. Check expiration and notification schedule, then create it. Pause any old alert for the same strategy first, to avoid duplicate trades.

Ready when: the alert is listed as active in TradingView's Alerts panel. Your own strategy sends no confirmation; its next real order fill is the first message.

Existing or protected strategies do not gain automatic confirmation from a webhook URL alone. They need compatible code from their creator, or their next real order-fill event. Do not replace your strategy with the SMA example just to test its connection.

### Your first paper fill

The supplied strategy trades only when its 14 and 28 bar averages cross on a closed chart bar: on a 1-minute chart usually within an hour of market time, on a 5-minute chart hours, and never on demand. TradingView then sends the alert and BridgePit simulates the fill. You see it in two places: Strategies shows the position next to the strategy, and the Dashboard's Recent activity shows the FILL marked (paper). Match it to the event and its Webhook status in TradingView's alert log. Backtest trades do not send these alerts.

With the supplied strategy, a strategy that has never filled in BridgePit opens the intended position at its saved size on its first signal. It does not close a historical trade it never held. If you already traded or closed the strategy manually, check that both positions match before continuing. Confirmation itself places no trade.

Paper setup complete: A real strategy event has produced the matching simulated fill. A setup confirmation alone does not complete this step.

After your first fill. The test strategy keeps trading on paper at every cross of its averages. BridgePit reminds you while it is active: the Dashboard, the Strategies page and the box under Alert setup show test alert active with the number of paper fills, and each paper fill notification repeats it. When you have seen enough, delete the alert in TradingView: open the Alerts panel, find the alert on BridgePit 14/28 SMA for your strategy's name, and delete it; remove the script from the chart if you like. Then keep or delete the strategy under Strategies.

You can continue on paper for free. Observe your strategy's entries, exits and sizing before broker execution. If you change its TradingView inputs, script, symbol or timeframe, recreate its alert so the saved copy uses those changes.

### No confirmation or strategy fill?

Start with TradingView's alert log. No event: check the strategy, market hours, expiration and notification schedule. For automatic confirmation, include alert() function calls and keep On realtime bar tick in the supplied strategy's Properties. Its order decisions remain at candle close. A saved alert keeps its own copy of the script and settings; editing the chart does not update that copy.

Failed webhook: check its public address. No receipt in BridgePit: read the setup status. A changed address or alert token requires updated code and a replacement alert. Pine sends the startup confirmation once per running script instance; it does not automatically resend after failed delivery. A quiet strategy may still need time for a real trade. Do not change its logic to force one. If BridgePit rejects a trade, use its precise reason below.

For a separate delivery diagnostic, open Settings → Optional diagnostic: send a separate price alert → Prepare connection test. This tests a different message and is optional. The local Send a test signal and public-path Send a test alert the long way round both start on this Mac. Neither establishes that your TradingView strategy alert is configured correctly.

## Add an outside-computer warning

In Settings → Outside-computer monitor, follow the three numbered steps.
This is an optional backup which can warn even when the Mac is offline.

1. Open Healthchecks.io from the button, sign in or create your own account,
   and add a separate check for this installation. Set Period to **1 minute**
   and Grace Time to **2 minutes**. Verify the email destination under
   Notification Methods and copy that check's **UUID Ping URL**.
2. Paste it into **Private monitor link**, then **Save monitor**. It is masked
   and cleared after saving. No file editing or restart is required. Wait for
   **Heartbeat accepted**, or use **Check connection**.
3. With brokers disconnected, their execution/autoconnect off, and the paper
   book flat, use **Start warning test**. Keep BridgePit running. Check your
   phone on mobile data for a new **DOWN** message, expected after about three
   minutes with that schedule. Only then click **I received the DOWN warning**.
   Look for the subsequent **UP** recovery message.

The test pauses only heartbeat sending for at most five minutes. It resumes
on confirmation, cancellation or timeout; restarting BridgePit also resumes it.
If no warning arrives, check the check's schedule, notification destination and
spam folder, then retry. Retest whenever you change the monitor's recipient.
Create a separate check for this installation.

This proves your receipt of a monitoring warning, not broker execution or
TradingView delivery. The monitor cannot close trades or recreate missed
alerts. Keep normal Telegram/email notifications configured too. For planned
shutdowns, pause the matching check in Healthchecks to avoid expected downtime
warnings. Normal heartbeats reactivate that check when BridgePit resumes.

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

With a standard alert message, Contracts per signal both multiplies the alert quantity and caps the resulting absolute position. From flat, an alert for one contract with a setting of three produces three. An alert for two with a setting of one is rejected: it would exceed the cap. Raising the setting does not fix a larger entry from flat, because it raises the multiplier too.

The supplied 14/28 SMA setup includes explicit position information. For a strategy that has never filled in BridgePit, its first reversal opens only the intended position at the saved size. Later reversals still close the current position and open the opposite one. This exception does not apply to standard alert messages or to an existing position book.

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

Keep BridgePit and Tailscale running during trading hours. Turn on Tailscale's Start at login switch if appropriate; it is the optional setting from its setup screens. BridgePit does not start itself after a reboot. Open it yourself, or add BridgePit under macOS System Settings → General → Login Items. Check the public path before relying on alerts. Funnel started with --bg persists and resumes when Tailscale runs again; do not treat a saved URL as evidence of availability.

TradingView retries certain server failures, but does not guarantee delivery. BridgePit monitors the saved public address in the background, with the dashboard open or closed. Its own warnings also depend on this Mac and a working notification route. Broker-held orders may still execute when this Mac is offline.

Telegram /halt blocks new entries; /flatten requests closing open positions; /resume allows entries again. Confirm those actions with YES within 60 seconds. /path checks the public route. Silence can mean a stopped app, network problem or notification problem; it does not identify the cause. Email can warn you but cannot perform these commands.

Still stuck? [support@bridgepit.com](mailto:support@bridgepit.com). Include the step, exact error and matching activity row. Omit tokens, passwords and licence keys.

[Download this guide as text](bridgepit-setup-guide.md)
