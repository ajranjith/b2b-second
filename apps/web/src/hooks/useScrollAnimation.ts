'use client';

import { useEffect, useRef } from 'react';

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'flip-up';

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  animation: AnimationType = 'fade-up',
  options?: { delay?: number; threshold?: number; once?: boolean }
) {
  const ref = useRef<T>(null);
  const { delay = 0, threshold = 0.15, once = true } = options ?? {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.setAttribute('data-scroll', animation);
    el.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('scroll-visible');
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove('scroll-visible');
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animation, delay, threshold, once]);

  return ref;
}
