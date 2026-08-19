import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { addProjectBase, extractHtmlProject } from "./html-project";

describe("HTML project source", () => {
  it("extracts a root entry and normalized local assets", async () => {
    const zip = new JSZip();
    zip.file("index.html", "<!doctype html><html><head></head><body><img src=images/logo.svg></body></html>");
    zip.file("images/logo.svg", "<svg></svg>");
    const file = new File([await zip.generateAsync({ type: "uint8array" }) as unknown as BlobPart], "site.zip");

    const project = await extractHtmlProject(file);
    expect(project.assets.map((asset) => asset.path)).toEqual(["images/logo.svg"]);
    expect(addProjectBase(project.entryHtml, "/api/render/id/project/token/")).toContain(
      '<base href="/api/render/id/project/token/">'
    );
  });

  it("rejects traversal paths and projects without a root entry", async () => {
    const traversal = new JSZip();
    traversal.file("../secret.txt", "no");
    traversal.file("index.html", "ok");
    const traversalFile = new File([await traversal.generateAsync({ type: "uint8array" }) as unknown as BlobPart], "site.zip");
    await expect(extractHtmlProject(traversalFile)).rejects.toThrow("paths");

    const missing = new JSZip();
    missing.file("nested/page.html", "ok");
    const missingFile = new File([await missing.generateAsync({ type: "uint8array" }) as unknown as BlobPart], "site.zip");
    await expect(extractHtmlProject(missingFile)).rejects.toThrow("index.html");
  });
});
