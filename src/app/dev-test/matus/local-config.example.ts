// Skopíruj ako local-config.ts a doplň hodnoty z Twilio dashboardu.
// local-config.ts je v .gitignore — nedostane sa do gitu.

export const phoneCallConfig = {
  accountSid: "AC...",
  authToken: "...",
  fromNumber: "+1...",
  toNumber: "+421915414839",
  message:
    "Ahoj. Toto je testovací hovor z Box66. Ak počuješ túto správu, funguje to.",
};
