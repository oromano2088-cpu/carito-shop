"use client";

import { useRef, useState } from "react";
import { uploadProductImage } from "@/lib/upload-image";

const MAX_IMAGES = 5;

export function ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");

  const remaining = MAX_IMAGES - images.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) return;
    setUploading((u) => u + list.length);
    let current = images;
    for (const file of list) {
      try {
        const url = await uploadProductImage(file);
        current = [...current, url];
        onChange(current);
      } catch (err) {
        console.error(err);
        setError("No se pudo subir una de las fotos. Probá de nuevo.");
      } finally {
        setUploading((u) => Math.max(0, u - 1));
      }
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));
  const setCover = (idx: number) => onChange([images[idx], ...images.filter((_, i) => i !== idx)]);
  const moveLeft = (idx: number) => {
    if (idx === 0) return;
    const next = [...images];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };
  const moveRight = (idx: number) => {
    if (idx === images.length - 1) return;
    const next = [...images];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted">Fotos del producto (hasta 5) — la primera es la portada</p>
      <div className="grid grid-cols-5 gap-2">
        {images.map((url, idx) => (
          <div key={url + idx} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] text-center py-0.5 font-semibold">
                Portada
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center"
            >
              ✕
            </button>
            {idx !== 0 && (
              <button
                type="button"
                onClick={() => setCover(idx)}
                title="Usar como portada"
                className="absolute top-1 left-1 h-5 w-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center"
              >
                ⭐
              </button>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-0.5 left-0.5 flex gap-0.5">
                {idx > 0 && (
                  <button type="button" onClick={() => moveLeft(idx)} className="h-4 w-4 rounded bg-black/70 text-white text-[9px] flex items-center justify-center">
                    ‹
                  </button>
                )}
                {idx < images.length - 1 && (
                  <button type="button" onClick={() => moveRight(idx)} className="h-4 w-4 rounded bg-black/70 text-white text-[9px] flex items-center justify-center">
                    ›
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {Array.from({ length: Math.max(0, remaining) }).map((_, i) => (
          <div
            key={`ph-${i}`}
            className="aspect-square rounded-xl border-2 border-dashed border-border/60 bg-surface flex items-center justify-center text-muted text-lg"
          >
            {uploading > 0 && i === 0 ? <span className="animate-pulse text-base">⏳</span> : "+"}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={remaining <= 0}
          onClick={() => cameraRef.current?.click()}
          className="flex-1 h-11 rounded-xl border border-border bg-surface-2 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          📷 Tomar foto
        </button>
        <button
          type="button"
          disabled={remaining <= 0}
          onClick={() => galleryRef.current?.click()}
          className="flex-1 h-11 rounded-xl border border-border bg-surface-2 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          🖼️ Galería
        </button>
      </div>
      {error && <p className="text-danger text-xs font-semibold">{error}</p>}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
