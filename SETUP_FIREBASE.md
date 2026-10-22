# Little Us — Firebase Spark setup (private room for two devices)

This project intentionally keeps database access closed by default. Do not use public rules such as `.read: true` or `.write: true`.

## One-time setup

1. In Firebase Console, open project `little-us-723b7`.
2. Authentication → Sign-in method → enable **Anonymous**.
3. Realtime Database → Rules. Copy the rules from `database.rules.json` in this repository into the Rules editor, but keep the two placeholder UID values until you have collected both device IDs. Publish these placeholder rules first; they deny access until the real UIDs are added.
4. Open Little Us on phone 1. Enter PIN `271125` and tap **Hubungkan**. The status shows that phone's Firebase anonymous UID. Copy it somewhere private.
5. Repeat on phone 2 and copy its UID. Each phone must use its own persistent browser/WebView storage; do not clear app data after collecting IDs.
6. In Realtime Database → Rules, replace every occurrence of `GANTI_UID_HP_1` with phone 1's UID and every occurrence of `GANTI_UID_HP_2` with phone 2's UID. There are two occurrences of each placeholder. Publish.
7. On both phones, tap **Hubungkan** again. If the UIDs match the rules and Anonymous Auth is enabled, the app should connect. Send Kangen/Peluk/Daisy between phones to test.

## Important security notes

- The six-digit PIN is only a user-facing prompt; it is not the security boundary. Access is enforced by the two Firebase UIDs in database rules.
- Never share either UID publicly. Anyone who can modify Firebase project Rules can change access.
- If an app is reinstalled or its WebView storage is cleared, anonymous authentication may create a new UID. That new UID must replace the old one in the Rules.
- If the status reports permission denied, check both UIDs carefully and confirm the published rules. The app cannot update Firebase Rules itself.
- This uses Firebase Spark services only; no Cloud Functions or paid backend is required for foreground realtime signals. It does not provide guaranteed notifications when the app is closed.
