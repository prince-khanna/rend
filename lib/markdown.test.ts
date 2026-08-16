import { describe, expect, it } from "vitest";
import { renderMarkdownPage } from "./markdown";

describe("renderMarkdownPage", () => {
  it("renders Mermaid fences and loads a pinned strict Mermaid runtime", async () => {
    const html = await renderMarkdownPage(`
# Architecture

\`\`\`mermaid
flowchart LR
  Upload --> Page
\`\`\`
`);

    expect(html).toContain("<h1>Architecture</h1>");
    expect(html).toContain(
      '<pre class="mermaid" data-pigeon-mermaid>flowchart LR\n  Upload --&gt; Page</pre>'
    );
    expect(html).toContain("mermaid@11.16.1/dist/mermaid.min.js");
    expect(html).toContain('integrity="sha384-');
    expect(html).toContain('referrerpolicy="no-referrer"');
    expect(html).toContain('securityLevel: "strict"');
  });

  it("preserves the existing renderer for other fenced code blocks", async () => {
    const html = await renderMarkdownPage(`
Before

\`\`\`typescript
const answer = 42;
\`\`\`

After
`);

    expect(html).toContain("<p>Before</p>");
    expect(html).toContain(
      '<pre><code class="language-typescript">const answer = 42;\n</code></pre>'
    );
    expect(html).toContain("<p>After</p>");
    expect(html).not.toContain("mermaid.min.js");
  });

  it("escapes Mermaid source before placing it in the document", async () => {
    const html = await renderMarkdownPage(`
\`\`\`mermaid
flowchart LR
  A[</pre><script>globalThis.compromised = true</script>] --> B
\`\`\`
`);

    expect(html).toContain("A[&lt;/pre&gt;&lt;script&gt;");
    expect(html).not.toContain("<script>globalThis.compromised");
  });

  it("recognizes Mermaid language labels case-insensitively", async () => {
    const html = await renderMarkdownPage(`
\`\`\`MERMAID
sequenceDiagram
  Alice->>Bob: Hello
\`\`\`
`);

    expect(html).toContain(
      '<pre class="mermaid" data-pigeon-mermaid>sequenceDiagram'
    );
  });
});
