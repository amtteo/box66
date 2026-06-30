import type { Metadata } from "next";

import { AutoRing } from "./auto-ring";

export const metadata: Metadata = {
  title: "·",
  robots: { index: false, follow: false },
};

export default function RingTestPage() {
  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <AutoRing />
    </main>
  );
}
