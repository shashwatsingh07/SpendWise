# SpendWise — Android (Capacitor) & SMS Auto-Import

Phase 2 turns SpendWise into an Android app that reads your bank/UPI SMS and
offers them for one-tap import. The **parsing logic and UI are already done and
work in the browser** (a demo SMS batch appears on the dashboard in dev mode).
This file covers the remaining native steps, which need **Android Studio + the
Android SDK** on your machine.

## How the pieces fit

```
device SMS ──▶ smsBridge.readDeviceSms()  (native plugin: "SmsInbox")
            └▶ bankPatterns.parseSmsMessages()  → ParsedTransaction[]
               └▶ useSmsSync  (dedupe vs processed + existing txns)
                  └▶ SmsImportBanner  → ImportPreview modal → bulkAddTransactions(importSource:'sms')
```

On the **web** there is no inbox, so `smsBridge` returns nothing and the banner
falls back to `src/data/sampleSms.ts` (only when `import.meta.env.DEV`).

## 1. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

`capacitor.config.ts` is already committed (appId `com.spendwise.app`,
webDir `dist`).

## 2. Add the Android platform

```bash
npm run build          # produce dist/
npx cap add android    # scaffolds ./android (Gradle project)
npx cap sync           # copies web build + plugins into android/
```

## 3. Add an SMS-reader plugin

Capacitor has no first-party SMS-inbox plugin. Install a community one and
register it under the name **`SmsInbox`** (that's the name `smsBridge.ts`
looks up). The expected plugin API is:

```ts
SmsInbox.checkPermission()   // -> { granted: boolean }
SmsInbox.requestPermission() // -> { granted: boolean }
SmsInbox.getMessages({ minDate? }) // -> { messages: { address, body, date }[] }
```

`capacitor-sms-inbox` is a reasonable starting point. If the plugin you pick
exposes a different method/return shape, adapt the small mapping in
`src/lib/smsBridge.ts` (`readDeviceSms`) — that's the only place that touches
the native API.

## 4. Declare the permission

In `android/app/src/main/AndroidManifest.xml`, above `<application>`:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

`READ_SMS` is a **runtime** permission — `useSmsSync` already calls
`requestSmsPermission()` on first scan, so the OS prompt fires automatically.

> Note: Google Play restricts SMS permissions to apps whose core function needs
> them. For personal/sideloaded use this is fine; for a Play listing you'd need
> the SMS permissions declaration (or switch to the SMS Retriever / user-share
> flow).

## 5. Build & run

```bash
npx cap open android      # opens Android Studio
# or headless:
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

After any web change: `npm run build && npx cap sync`.

## 6. Test checklist

- First launch → OS asks for SMS permission → grant.
- Dashboard shows the "_N_ new transactions found" banner.
- Tap **Review** → edit/deselect rows → **Import**.
- Re-open the app → the same SMS do **not** re-appear (processed-fingerprint
  dedupe in `useSmsSync`).
- Imported rows show `importSource: 'sms'` and learned merchants/VPAs
  auto-categorise next time.

## What to tune on real data

The parser was validated against representative SBI/HDFC/ICICI/Axis/Kotak/Paytm
formats (`src/data/sampleSms.ts`). Banks tweak SMS wording over time — if a real
message parses wrong, add it to `sampleSms.ts`, run the parser, and adjust the
regexes in `src/lib/bankPatterns.ts`. Keep the rule that a message must have
**both an amount and a debit/credit verb** to count as a transaction.
