"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo as PhotoType } from "@/lib/photos";

type Props = { photo: PhotoType; className?: string; sizes: string; priority?: boolean };

// Unsplash resizes and compresses on its own CDN, so we load directly from it
const sized = (src: string) => `${src}?auto=format&fit=crop&w=1800&q=80`;

// Tries each source in turn; shows a warm neutral background while loading or if all fail
export default function Photo({ photo, className = "", sizes, priority }: Props) {
  const [failed, setFailed] = useState<{ key: string; count: number }>({ key: photo.alt, count: 0 });
  const index = failed.key === photo.alt ? failed.count : 0; // reset when the photo changes
  const src = photo.srcs[index];

  return (
    <div className={`photo-fallback relative overflow-hidden ${className}`}>
      {src && (
        <Image
          key={src}
          src={sized(src)}
          alt={photo.alt}
          fill
          unoptimized
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setFailed({ key: photo.alt, count: index + 1 })}
        />
      )}
    </div>
  );
}
