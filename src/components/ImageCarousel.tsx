"use client";

import { useRef, useState } from "react";

/** Una foto de producto. En modo "contain" se ve el producto entero (sin zoom) y el
 * espacio sobrante se rellena con la misma foto desenfocada, así la pantalla queda llena. */
function Slide({ url, alt, contain, padClass, snap }: { url: string; alt: string; contain: boolean; padClass: string; snap: boolean }) {
  if (!contain) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={`w-full h-full flex-shrink-0 object-cover ${snap ? "snap-start" : "absolute inset-0"}`} loading="lazy" />;
  }
  return (
    <div className={`relative w-full h-full flex-shrink-0 overflow-hidden bg-black ${snap ? "snap-start" : "absolute inset-0"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50" loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className={`relative w-full h-full object-contain ${padClass}`} loading="lazy" />
    </div>
  );
}

/** Carrusel de fotos de producto (swipe horizontal + puntos indicadores). */
export function ImageCarousel({
  images,
  alt,
  fit = "cover",
  padClass = "",
}: {
  images: string[];
  alt: string;
  fit?: "cover" | "contain";
  padClass?: string;
}) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const contain = fit === "contain";

  const onScroll = () => {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    return <Slide url={images[0]} alt={alt} contain={contain} padClass={padClass} snap={false} />;
  }

  return (
    <div className="absolute inset-0">
      <div ref={ref} onScroll={onScroll} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {images.map((url, i) => (
          <Slide key={i} url={url} alt={`${alt} ${i + 1}`} contain={contain} padClass={padClass} snap />
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
