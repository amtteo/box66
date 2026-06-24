"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  { mobile: "/slide1mobile.webp", desktop: "/slider1.webp" },
  { mobile: "/slide2mobile.webp", desktop: "/slider2.webp" },
  { mobile: "/slide3mobile.webp", desktop: "/slider3.webp" },
] as const;

const SLIDE_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 48;

export function HeroSlider({ onOrder }: { onOrder: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(
      ((index % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  }, []);

  const restartAutoplay = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
  }, []);

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [restartAutoplay]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    pointerStartX.current = e.clientX;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;
    setDragOffset(e.clientX - pointerStartX.current);
  }

  function finishPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;

    const delta = e.clientX - pointerStartX.current;
    if (delta < -SWIPE_THRESHOLD_PX) {
      goToIndex(activeIndex + 1);
      restartAutoplay();
    } else if (delta > SWIPE_THRESHOLD_PX) {
      goToIndex(activeIndex - 1);
      restartAutoplay();
    }

    pointerStartX.current = null;
    setDragOffset(0);
    setIsDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div className="pb-4 pt-0 sm:py-4" aria-label="Úvodný slider">
      <div className="relative w-full overflow-hidden border-2 border-primary">
        <div
          className={cn(
            "flex touch-pan-y select-none",
            isDragging
              ? "cursor-grabbing transition-none"
              : "cursor-grab transition-transform duration-500 ease-in-out",
          )}
          style={{
            transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
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
              onClick={() => {
                setActiveIndex(index);
                restartAutoplay();
              }}
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
