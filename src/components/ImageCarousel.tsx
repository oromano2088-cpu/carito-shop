"use client";

import { useRef, useState } from "react";

/** Carrusel de fotos de producto (swipe horizontal + puntos indicadores). Si hay una
 * sola imagen, se comporta como un <img> normal sin overhead extra. */
export function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={images[0]} alt={alt} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />;
  }

  return (
    <div className="absolute inset-0">
      <div ref={ref} onScroll={onScroll} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {images.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt={`${alt} ${i + 1}`} className="w-full h-full flex-shrink-0 snap-start object-cover" loading="lazy" />
        ))}
      </div>
      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
