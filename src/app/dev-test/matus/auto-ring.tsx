"use client";

import { useEffect, useState } from "react";

import { type RingState, ringNow } from "./actions";

export function AutoRing() {
  const [state, setState] = useState<RingState | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
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
