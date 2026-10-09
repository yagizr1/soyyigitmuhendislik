"use client";

import { useEffect, useRef, useState } from "react";

function targetOf(value: string): number | null {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const target = Number(digits);
  return Number.isFinite(target) ? target : null;
}

export function CountUp({ value }: { value: string }) {
  const target = targetOf(value);
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (target === null) return;
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target);
      return;
    }

    let frame = 0;
    let started = false;
    const duration = 900;

    function run() {
      const start = performance.now();
      function tick(now: number) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - progress) ** 3;
        setCurrent(Math.round(target! * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return;
        started = true;
        run();
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  if (target === null) return <span>{value}</span>;

  return <span ref={ref}>{current}</span>;
}
