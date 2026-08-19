import { describe, expect, it } from "vitest";
import {
  getSourceDescriptor,
  parseStructuredSource,
  readSourceText,
  validateSourceFilename,
  renderDataPreview,
  renderTextPreview,
  SourceValidationError,
} from "./source";

describe("source contract", () => {
  it("maps the supported extensions to stable source metadata", () => {
    expect(getSourceDescriptor("notes.MARKDOWN")).toEqual({ family: "markdown", format: "markdown" });
    expect(getSourceDescriptor("config.yml")).toEqual({ family: "data", format: "yml" });
    expect(getSourceDescriptor("build.PS1")).toEqual({ family: "script", format: "ps1" });
    expect(getSourceDescriptor("archive.tar")).toBeNull();
  });

  it("covers every supported script family and project archive", () => {
    for (const extension of ["js", "mjs", "cjs", "ts", "tsx", "jsx", "py", "sh", "bash", "zsh", "ps1", "rb", "php"]) {
      expect(getSourceDescriptor(`script.${extension}`)?.family).toBe("script");
    }
    expect(getSourceDescriptor("site.zip")).toEqual({ family: "html_project", format: "zip" });
  });

  it("parses JSON and YAML without evaluating source", () => {
    expect(parseStructuredSource('{"answer": 42}', "json")).toEqual({ answer: 42 });
    expect(parseStructuredSource("answer: 42", "yaml")).toEqual({ answer: 42 });
  });

  it("rejects malformed or excessively nested structured data with a source-specific error", () => {
    expect(() => parseStructuredSource("{oops", "json")).toThrow(SourceValidationError);
    expect(() => parseStructuredSource("{oops", "json")).toThrow("Invalid JSON source");
    const deeplyNested = `${"[".repeat(101)}0${"]".repeat(101)}`;
    expect(() => parseStructuredSource(deeplyNested, "json")).toThrow("nested too deeply");
  });

  it("rejects unsafe filenames and invalid UTF-8 before rendering", async () => {
    expect(() => validateSourceFilename("../secret.js")).toThrow("path separators");
    expect(() => validateSourceFilename("bad\\name.js")).toThrow("path separators");
    await expect(readSourceText(new File([new Uint8Array([0xc3, 0x28])], "bad.js"))).rejects.toThrow("valid UTF-8");
    await expect(readSourceText(new File([], "empty.js"))).rejects.toThrow("cannot be empty");
  });

  it("escapes hostile data and script source in previews", () => {
    const hostile = "</code><script>globalThis.pwned=true</script>";
    const dataPreview = renderDataPreview({ value: hostile }, "config.json", "json");
    const scriptPreview = renderTextPreview(hostile, "run.js", "js");

    expect(dataPreview).toContain("&lt;/code&gt;&lt;script&gt;");
    expect(scriptPreview).toContain("&lt;/code&gt;&lt;script&gt;");
    expect(dataPreview).not.toContain("<script>globalThis.pwned");
    expect(scriptPreview).not.toContain("<script>globalThis.pwned");
  });
});
