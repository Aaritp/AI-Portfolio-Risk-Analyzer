import { useEffect, useRef, useState } from "react";

/**
 * Triggers a reveal animation when the element scrolls into view.
 * Returns [ref, isVisible] — attach ref to the element you want to animate.
 */
export function useReveal(threshold = 0.12) {
  const ref     = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}
