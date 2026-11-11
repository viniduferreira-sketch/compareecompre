import { Package } from "lucide-react";
import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Product photo that swaps a missing/broken URL for a neutral box placeholder (never the browser's broken icon). */
export function ProductImage({ src, alt, className, placeholderClassName, onUnavailable, ...rest }: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null | undefined; placeholderClassName?: string | undefined;onUnavailable?:()=>void }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Errors fired before hydration never reach onError, so re-check the already-loaded element.
  useEffect(() => {
    const img = ref.current;
    setFailed(Boolean(img && img.complete && img.naturalWidth === 0));
    if(!src || (img && img.complete && img.naturalWidth===0))onUnavailable?.();
  }, [src]);
  if (!src || failed) {
    return (
      <span role="img" aria-label={alt ? `Imagem indisponível: ${alt}` : "Imagem indisponível"} className={cn("flex size-full items-center justify-center rounded-md bg-muted", placeholderClassName)}>
        <Package className="size-1/3 max-h-16 max-w-16 text-muted-foreground/70" strokeWidth={1.5} aria-hidden />
      </span>
    );
  }
  return <img ref={ref} src={src} alt={alt} className={className} onError={() => {setFailed(true);onUnavailable?.();}} {...rest} />;
}
