"use client";

type Props = { src: string };

export function HtmlFrame({ src }: Props) {
  return (
    <iframe
      src={src}
      sandbox="allow-scripts"
      className="w-full flex-1 border-0"
      title="Rendered HTML page"
    />
  );
}
