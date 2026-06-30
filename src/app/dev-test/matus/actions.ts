"use server";

import { phoneCallConfig } from "./config";
import { placeTestCall } from "./twilio";

export type RingState = {
  ok: boolean;
  message: string;
  callSid?: string;
};

export async function ringNow(): Promise<RingState> {
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
