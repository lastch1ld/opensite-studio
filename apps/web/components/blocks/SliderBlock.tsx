"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { BlockImage } from "./types";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// docs/starter-templates.md's Aperture port of Slider.tsx: a controlled
// slide-index track (`transform: translateX(...)`), not the source's
// native-scroll-snap + IntersectionObserver active-dot-sync — deliberate
// simplification, see the doc's "What we simplified" section. Plain "‹"/
// "›" glyphs instead of lucide-react (AGENTS.md: no icon libraries inside
// components/blocks/**).
export function SliderBlock({ images, style }: { images: BlockImage[]; style: Record<string, unknown> }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>No images yet — add some in the Properties panel.</p>;
  }

  const arrowStyle: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.9)",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    padding: 0,
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ overflow: "hidden", borderRadius: str(style.borderRadius, "0") }}>
        <div
          style={{
            display: "flex",
            transform: `translateX(-${active * 100}%)`,
            transition: "transform 0.3s ease",
          }}
        >
          {images.map((image) => (
            <div key={image.id} style={{ position: "relative", flex: "0 0 100%", aspectRatio: str(style.aspectRatio, "16 / 10") }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } as CSSProperties}
              />
              {image.caption && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "16px",
                    background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                    color: "#ffffff",
                    fontSize: "14px",
                  }}
                >
                  {image.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setActive((active - 1 + images.length) % images.length)}
            style={{ ...arrowStyle, left: "12px" }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setActive((active + 1) % images.length)}
            style={{ ...arrowStyle, right: "12px" }}
          >
            ›
          </button>
          <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "8px" }}>
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActive(index)}
                style={{
                  width: index === active ? "22px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  border: "none",
                  padding: 0,
                  background: index === active ? "#111111" : "#d1d5db",
                  cursor: "pointer",
                  transition: "width 0.15s ease, background 0.15s ease",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
