"use server";

import { phoneCallConfig } from "./local-config";
import { placeTestCall } from "./twilio";

export type RingState = {
  ok: boolean;
  message: string;
  callSid?: string;
};

function isConfigured(): boolean {
  const { accountSid, authToken, fromNumber } = phoneCallConfig;
  return Boolean(accountSid && authToken && fromNumber);
}

export async function ringNow(): Promise<RingState> {
  if (!isConfigured()) {
    return {
      ok: false,
      message:
        "V local-config.ts chýbajú Twilio údaje. Po registrácii mi pošli kľúče a doplním ich.",
    };
  }

  const result = await placeTestCall({
    accountSid: phoneCallConfig.accountSid,
    authToken: phoneCallConfig.authToken,
    fromNumber: phoneCallConfig.fromNumber,
    toNumber: phoneCallConfig.toNumber,
    message: phoneCallConfig.message,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  return {
    ok: true,
    message: `Zvoní ${phoneCallConfig.toNumber}`,
    callSid: result.callSid,
  };
}
