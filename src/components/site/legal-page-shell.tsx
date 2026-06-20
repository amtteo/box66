"use client";

import type { ReactNode } from "react";

export const LEGAL_SECTION_BLOCK = "rounded-lg border-2 border-primary p-8";

type LegalPageShellProps = {
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  description,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <>
      <section className="border-b-2 border-primary bg-yellow-400">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3">{description}</p>
          <p className="mt-2 text-sm mt-12">
            Posledná aktualizácia: {updatedAt}
          </p>
        </div>
      </section>

      <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="legal-prose space-y-8 text-sm leading-relaxed sm:text-base [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-6 [&_h3]:mb-6 [&_h3]:text-xl [&_h3]:font-semibold">
          {children}
        </div>
      </article>
    </>
  );
}
