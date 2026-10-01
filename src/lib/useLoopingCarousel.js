import { useLayoutEffect, useRef, useState } from "react";

// A horizontal, swipeable row of full-width panels that loops endlessly,
// built on CSS scroll-snap so swipes, trackpads, and momentum are native:
// while you drag, the next panel slides in and the current one slides out.
//
// With 2+ items the scroller holds
//   [copy of last] [item 1] ... [item n] [copy of first]
// so swiping past either end lands on a copy that looks identical. Once the
// scroll settles we jump, without animation, to the real panel.
//
// Usage:
//   const { scrollerProps, slots, index, goTo } = useLoopingCarousel(n, start);
//   <div {...scrollerProps} className="flex snap-x snap-mandatory overflow-x-auto ...">
//     {slots.map(({ index, isClone, pos }) => <Panel key={...} inert={isClone} />)}
//   </div>
// Each panel needs: h-full w-full shrink-0 snap-center snap-always.
export function useLoopingCarousel(count, initialIndex = 0) {
  const scrollerRef = useRef(null);
  const settleTimer = useRef(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0)),
  );
  const looping = count > 1;
  const offset = looping ? 1 : 0;

  // Start on the chosen item's real panel, not the copy in front of it.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = (activeIndex + offset) * el.clientWidth;
    // Only on first render; later moves scroll themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const index = Math.min(activeIndex, Math.max(count - 1, 0));

  // i may be -1 or count: that scrolls onto a copy, and settle() wraps it.
  const goTo = (i) => {
    const el = scrollerRef.current;
    if (!el || count === 0) return;
    if (looping) {
      el.scrollTo({ left: (i + offset) * el.clientWidth, behavior: "smooth" });
    } else {
      el.scrollTo({ left: 0, behavior: "instant" });
    }
    setActiveIndex((i + count) % count);
  };

  // If the scroll came to rest on a copy, swap to the real panel in place,
  // carrying over how far down that panel was scrolled.
  const settle = () => {
    const el = scrollerRef.current;
    if (!el || !looping) return;
    const pos = Math.round(el.scrollLeft / el.clientWidth);
    const target = pos === 0 ? count : pos === count + 1 ? 1 : null;
    if (target === null) return;
    el.children[target].scrollTop = el.children[pos].scrollTop;
    el.children[pos].scrollTop = 0;
    el.scrollTo({ left: target * el.clientWidth, behavior: "instant" });
  };

  const onScroll = (e) => {
    if (count === 0) return;
    const el = e.currentTarget;
    const pos = Math.round(el.scrollLeft / el.clientWidth);
    const real = (pos - offset + count) % count;
    if (real !== index) setActiveIndex(real);
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, 120);
  };

  const order = looping
    ? [count - 1, ...Array(count).keys(), 0]
    : count
      ? [0]
      : [];
  const slots = order.map((i, pos) => ({
    index: i,
    pos,
    isClone: looping && (pos === 0 || pos === count + 1),
  }));

  return {
    scrollerProps: { ref: scrollerRef, onScroll },
    slots,
    index,
    goTo,
    looping,
  };
}
