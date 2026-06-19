# Publish Vantage to Google Play (Android-first) — Step-by-Step

Good news: the in-Lovable code work is already done — Capacitor is installed, `capacitor.config.ts` is set (`appId: app.lovable.vantage`, `appName: Vantage`), an app icon exists, and a `/privacy` page is live. This plan is the click-by-click path to get the **Android** app onto the Google Play Store using **GitHub** to move the code to your computer. iOS is deferred until you have a Mac.

> Nothing below needs more code changes from me unless you want a different bundle ID or icon. The rest happens on your computer + Google Play Console (Lovable can't build native binaries).

---

## Part 1 — One-time accounts & tools (gather first)

```text
1. A Windows / Mac / Linux computer you can install software on.
2. Google Play Developer account ($25, ONE-TIME) -> https://play.google.com/console/signup
3. A GitHub account (free) -> https://github.com
4. About 1-2 hours the first time.
```

---

## Part 2 — Publish & connect GitHub (inside Lovable)

1. Click **Publish** (top-right) so the live site + `/privacy` page are current.
2. Open the **Plus (+)** menu (bottom-left of chat input) → **GitHub** → **Connect project**.
3. Authorize the Lovable GitHub App, pick your account/org, click **Create Repository**.
4. Copy the new repo's URL (you'll need it next).

---

## Part 3 — Get the code & build it (your computer)

1. Install **Node.js (LTS)** -> https://nodejs.org and **Git** -> https://git-scm.com.
2. Open a terminal and run (replace the URL with your repo's):
   ```text
   git clone <your-repo-url>
   cd <your-project-folder>
   npm install
   npm run build
   ```

---

## Part 4 — Create the Android project

```text
npx cap add android
npx cap sync
```
This creates an `android/` folder — the real native Android project.

---

## Part 5 — Build a signed release in Android Studio

1. Install **Android Studio** (free) -> https://developer.android.com/studio
2. Run `npx cap open android` to open the project.
3. Menu: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**.
4. Click **Create new...** to make a **keystore** (a password-protected signing file).
   - Save it somewhere safe and **back it up** — losing it means you can never update the app again.
   - Record the keystore password, key alias, and key password.
5. Choose **release**, finish. You get an **.aab** file (path shown at the end).

---

## Part 6 — Submit to Google Play Console

1. Go to **Google Play Console** → **Create app**.
2. Fill the store listing:
   - App name: **Vantage**
   - Short + full description
   - App icon (1024x1024) and at least 2 phone screenshots
   - **Privacy policy URL:** `https://vantage-front-edge.lovable.app/privacy`
3. Complete the required forms: **Content rating**, **Data safety**, **Target audience**, **Ads**.
4. Create a **Production** release → upload the **.aab** → review warnings → **Send for review**.
5. Review usually takes a few hours to a couple of days. Once approved, it's live.

---

## Part 7 — Updating later

Because the app loads your live published site (`server.url`), most content/UI changes you Publish in Lovable appear in the installed app **automatically** — no resubmission. You only rebuild + resubmit when you change native settings (app icon, app name, permissions, Capacitor plugins).

---

## iOS later (when you get a Mac)
Same repo. On a Mac: `npx cap add ios` → `npx cap sync` → `npx cap open ios` → Xcode **Archive** → **App Store Connect** (needs Apple Developer account, $99/yr). I'll give exact steps when you're ready.

---

## What I need from you
- Confirm the bundle ID **`app.lovable.vantage`** is fine (it can NOT change after first publish) — or give me a custom one like `com.yourcompany.vantage` and I'll update `capacitor.config.ts`.
- Want me to generate Play Store **screenshots** or a richer store description? I can prep those as assets/text.

Once you approve, I'll apply any bundle-ID/asset tweaks you want; everything else is the on-computer + Play Console steps above.