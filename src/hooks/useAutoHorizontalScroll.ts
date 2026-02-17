import { useEffect, useRef } from "react";

type Options = {
  /** فاصله زمانی بین هر حرکت (میلی‌ثانیه) */
  intervalMs?: number;
  /** مقدار اسکرول در هر قدم (پیکسل) */
  stepPx?: number;
  /** اگر true باشد روی هاور اسکرول متوقف می‌شود */
  pauseOnHover?: boolean;
};

/**
 * اسکرول افقی خودکار برای اسلایدرهای افقی (flex + overflow-x-auto)
 * برای ایجاد حس زنده بودن پلتفرم، مخصوصاً برای لیست تأمین‌کننده‌ها
 */
export function useAutoHorizontalScroll<T extends HTMLElement>(
  enabled: boolean,
  options: Options = {}
) {
  const containerRef = useRef<T | null>(null);
  const isPausedRef = useRef(false);

  const {
    intervalMs = 40, // ~25fps
    stepPx = 1.2, // سرعت ملایم
    pauseOnHover = true,
  } = options;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const handleMouseEnter = () => {
      if (pauseOnHover) {
        isPausedRef.current = true;
      }
    };

    const handleMouseLeave = () => {
      if (pauseOnHover) {
        isPausedRef.current = false;
      }
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    const id = window.setInterval(() => {
      if (!el || isPausedRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      // اگر محتوا قابل اسکرول نیست، کاری نکن
      if (scrollWidth <= clientWidth) return;

      const atEnd = scrollLeft + clientWidth + stepPx >= scrollWidth;

      if (atEnd) {
        // برگرد به ابتدای لیست
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: stepPx, behavior: "smooth" });
      }
    }, intervalMs);

    return () => {
      window.clearInterval(id);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, intervalMs, stepPx, pauseOnHover]);

  return containerRef;
}

