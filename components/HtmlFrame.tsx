"use client";

import { PAGE_IFRAME_SANDBOX } from "../lib/render-security";

type Props = { src: string };

export function HtmlFrame({ src }: Props) {
  return (
    <iframe
      src={src}
      sandbox={PAGE_IFRAME_SANDBOX}
      className="w-full flex-1 border-0"
      title="Rendered HTML page"
    />
  );
}
