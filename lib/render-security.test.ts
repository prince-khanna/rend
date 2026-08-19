import { describe, expect, it } from "vitest";
import { PAGE_IFRAME_SANDBOX, PAGE_RENDER_HEADERS } from "./render-security";

describe("Page render isolation", () => {
  it("uses the same scripts-only policy as the iframe", () => {
    expect(PAGE_IFRAME_SANDBOX).toBe("allow-scripts");
    expect(PAGE_RENDER_HEADERS["Content-Security-Policy"]).toBe("sandbox allow-scripts");
    expect(PAGE_RENDER_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(PAGE_RENDER_HEADERS["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(PAGE_RENDER_HEADERS["Content-Security-Policy"]).not.toContain("allow-same-origin");
  });
});
