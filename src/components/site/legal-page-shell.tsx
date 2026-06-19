import type { ReactNode } from "react";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPageShell({
  eyebrow,
  title,
  description,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Posledná aktualizácia: {updatedAt}
          </p>
        </div>
      </section>

      <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="legal-prose space-y-8 text-sm leading-relaxed text-foreground/90 sm:text-base [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </>
  );
}
