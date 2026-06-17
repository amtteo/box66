import Link from "next/link";

import { Button } from "@/components/ui/button";

export function MenuOrderBanner() {
  return (
    <section className="w-full border-t-2 border-primary">
      <div className="mx-auto max-w-6xl">
      <div className="flex flex-col items-end gap-6 px-4 py-12 sm:gap-8 sm:py-16">
        <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl md:text-5xl">
          Objednaj si donášku
        </h2> 
        <div>
        <Button
          asChild
          size="lg"
          className="bg-yellow-400 hover:bg-yellow-500 text-primary"
        >
          <Link href="/">Objednať</Link>
        </Button>
        </div>
        </div>
      </div>
    </section>
  );
}
