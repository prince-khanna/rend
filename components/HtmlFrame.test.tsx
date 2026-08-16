import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HtmlFrame } from "./HtmlFrame";

describe("HtmlFrame", () => {
  it("keeps Pages isolated with the allow-scripts-only sandbox", () => {
    const html = renderToStaticMarkup(
      <HtmlFrame src="https://storage.example/page.html" />
    );

    expect(html).toContain('sandbox="allow-scripts"');
    expect(html).not.toContain("allow-same-origin");
  });
});
