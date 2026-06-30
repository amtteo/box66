type PlaceTestCallInput = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  toNumber: string;
  message: string;
};

type PlaceTestCallResult =
  | { ok: true; callSid: string; status: string }
  | { ok: false; error: string };

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildTwiml(message: string): string {
  const safeMessage = escapeXml(message);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="sk-SK">${safeMessage}</Say></Response>`;
}

export async function placeTestCall(
  input: PlaceTestCallInput,
): Promise<PlaceTestCallResult> {
  const { accountSid, authToken, fromNumber, toNumber, message } = input;

  const body = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Twiml: buildTwiml(message),
  });

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
    "base64",
  );

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    },
  );

  const payload = (await response.json()) as {
    sid?: string;
    status?: string;
    message?: string;
    more_info?: string;
  };

  if (!response.ok) {
    const detail = payload.message ?? payload.more_info ?? response.statusText;
    return { ok: false, error: detail };
  }

  if (!payload.sid || !payload.status) {
    return { ok: false, error: "Twilio nevrátilo identifikátor hovoru." };
  }

  return { ok: true, callSid: payload.sid, status: payload.status };
}
