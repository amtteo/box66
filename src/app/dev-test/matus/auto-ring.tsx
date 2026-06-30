"use client";

import { useEffect, useState } from "react";

import { type RingState, ringNow } from "./actions";

const SESSION_KEY = "matus-rung";

export function AutoRing() {
  const [state, setState] = useState<RingState | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPending(false);
      setState({
        ok: true,
        message: "Hovor už bol spustený v tejto karte. Obnov stránku v novom okne pre ďalší pokus.",
      });
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "1");

    ringNow().then((result) => {
      setState(result);
      setPending(false);
    });
  }, []);

  if (pending) {
    return <p className="text-muted-foreground">Spúšťam hovor…</p>;
  }

  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
      {state.message}
    </p>
  );
}
