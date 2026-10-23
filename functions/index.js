const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { randomUUID } = require("node:crypto");

initializeApp();
const ROOM_PIN = defineSecret("LITTLE_US_ROOM_PIN");

// The PIN is validated only on the server. Never ship the PIN as a client-side
// security check. Each successful login receives a fresh Firebase identity with
// a roomMember custom claim; the UID stays internal to the app.
exports.loginWithPin = onCall(
  { secrets: [ROOM_PIN], enforceAppCheck: false },
  async (request) => {
    const pin = typeof request.data?.pin === "string" ? request.data.pin : "";
    if (!/^\d{6}$/.test(pin) || pin !== ROOM_PIN.value()) {
      // Keep the error generic so the endpoint doesn't disclose details.
      throw new HttpsError("unauthenticated", "PIN tidak sesuai. Coba lagi.");
    }

    const uid = `lu_${randomUUID().replace(/-/g, "")}`;
    const token = await getAuth().createCustomToken(uid, { roomMember: true });
    return { token };
  }
);
