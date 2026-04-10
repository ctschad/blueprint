import { getImageProps } from "next/image";

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  quality?: number;
};

function shouldBypassOptimization(src: string) {
  return src.startsWith("data:") || src.endsWith(".gif");
}

export function OptimizedImage({
  src,
  alt,
  className,
  sizes = "100vw",
  priority = false,
  width = 1600,
  height = 1600,
  quality = 90
}: OptimizedImageProps) {
  const { props } = getImageProps({
    src,
    alt,
    width,
    height,
    quality,
    sizes,
    priority,
    unoptimized: shouldBypassOptimization(src)
  });

  return (
    <img
      {...props}
      alt={alt}
      className={className}
    />
  );
}
