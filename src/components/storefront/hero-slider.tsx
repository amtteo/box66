"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  { mobile: "/slide1mobile.webp", desktop: "/slider1.webp" },
  { mobile: "/slide2mobile.webp", desktop: "/slider2.webp" },
] as const;

const SLIDE_INTERVAL_MS = 5000;

export function HeroSlider({ onOrder }: { onOrder: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pb-4 pt-0 sm:py-4" aria-label="Úvodný slider">
      <div className="relative w-full overflow-hidden border-2 border-primary">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, index) => (
            <div key={slide.desktop} className="w-full shrink-0">
              <Image
                src={slide.mobile}
                alt=""
                width={1080}
                height={1080}
                priority={index === 0}
                className="block w-full h-auto md:hidden"
                draggable={false}
              />
              <Image
                src={slide.desktop}
                alt=""
                width={1920}
                height={1080}
                priority={index === 0}
                className="hidden w-full h-auto md:block"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.desktop}
              type="button"
              aria-label={`Snímka ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "size-2.5 rounded-full border-2 border-primary transition-colors",
                index === activeIndex ? "bg-primary" : "bg-white",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          size="lg"
          onClick={onOrder}
          className="h-14 px-8 text-xl bg-red-600 font-bold text-white shadow-lg hover:bg-red-700"
        >
          OBJEDNAŤ
        </Button>
      </div>
    </div>
  );
}
