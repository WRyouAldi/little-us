# Little Us — PIN-only login

Target UX: one PIN field, one **Hubungkan** button, no UID copying or manual UID configuration on either phone.

## Security model
- The shared six-digit PIN is checked by a callable Cloud Function, never by browser JavaScript.
- On success the function creates a short-lived custom sign-in token for a fresh internal Firebase UID with the `roomMember: true` claim.
- The client signs in with that token; the UID is not shown in the UI.
- Realtime Database rules authorize only authenticated users with `roomMember == true`.
- Anyone who knows the shared PIN can join. Keep it private and change it if it is exposed.

## Deploy once (project owner)
1. Install Firebase CLI and authenticate: `firebase login`.
2. From the repository root, select the existing project: `firebase use little-us-723b7`.
3. Ensure Cloud Functions is enabled for this project. Deployment of Cloud Functions generally requires the Blaze billing plan.
4. Set the server-side secret (do not put the PIN in source code or GitHub):
   `firebase functions:secrets:set LITTLE_US_ROOM_PIN`
   Enter the six-digit room PIN when prompted.
5. Deploy: `firebase deploy --only functions`.
6. Publish the rules from `database.rules.json` in Firebase Console → Realtime Database → Rules.

## Test
- Wrong PIN: the app stays on the login modal and shows a generic error.
- Correct PIN on each device: login succeeds without copying or entering a UID.
- Verify both devices can send and receive Kangen/Peluk/Daisy.
- Verify an unauthenticated client cannot read or write room data.

Do not publish public `.read: true` or `.write: true` rules. The app change alone is not enough until the function secret is set, the function is deployed, and database rules are published.
