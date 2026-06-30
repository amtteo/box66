import { existsSync, readFileSync } from "fs";
import { join } from "path";

const defaults = {
  accountSid: "",
  authToken: "",
  fromNumber: "",
  toNumber: "+421915414839",
  message:
    "Ahoj. Toto je testovací hovor z Box66. Ak počuješ túto správu, funguje to.",
};

type PhoneCallSecrets = Partial<typeof defaults>;

function loadSecrets(): PhoneCallSecrets {
  try {
    const secretsPath = join(process.cwd(), "src/app/dev-test/matus/secrets.json");
    if (!existsSync(secretsPath)) {
      return {};
    }
    return JSON.parse(readFileSync(secretsPath, "utf8")) as PhoneCallSecrets;
  } catch {
    return {};
  }
}

export const phoneCallConfig = { ...defaults, ...loadSecrets() };
