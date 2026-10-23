# Little Us — Firebase setup

The app uses a PIN-only sign-in flow. Neither device needs to copy, view, or manually register a Firebase UID.

## One-time setup (project owner)

1. Open Firebase project `little-us-723b7`.
2. Ensure Realtime Database exists.
3. Install Firebase CLI and sign in with an account that can deploy Functions.
4. From the repository root, select the project with `firebase use little-us-723b7`.
5. Set the server-side secret using `firebase functions:secrets:set LITTLE_US_ROOM_PIN`. Enter the shared six-digit PIN when prompted. Do not store the PIN in client code or commit it to Git.
6. Deploy the login function: `firebase deploy --only functions`.
7. Publish the rules in `database.rules.json` (Firebase Console → Realtime Database → Rules), or run `firebase deploy --only database`.
8. Install/update the app on both devices. Each person enters the same PIN and taps **Hubungkan**. No UID setup is required.

## What the login does

- The PIN is validated by the server-side `loginWithPin` Cloud Function.
- On success, Firebase signs the device in with a custom token and an internal UID.
- The app never displays that UID.
- Database rules allow room access only for authenticated tokens carrying the `roomMember: true` claim.
- Memory data is read-only to clients; signals are writable only by authenticated room members.

## Important

- Deploying Cloud Functions generally requires the Firebase Blaze billing plan. Check expected usage and billing before deploying.
- Anyone who knows the shared PIN can join the room. Keep it private and change the server secret if exposed.
- Do not use public rules such as `.read: true` or `.write: true`.
- This change is not live until the function is deployed and the new database rules are published. A source-code commit alone does not configure the Firebase project.
- Test wrong PIN, correct PIN on both devices, sending/receiving Kangen/Peluk/Daisy, reading memories, and unauthenticated database access before considering rollout complete.
