import { Marked } from "marked";

const MERMAID_VERSION = "11.16.1";
const MERMAID_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js`;
const MERMAID_SCRIPT_INTEGRITY =
  "sha384-aBQXj4hK6Jm05i7aQAsUV3bLdSUrHX1BGYfMB0166TtWt/RRaw+h0Eelme9OCOvy";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isMermaidFence(language: string | undefined): boolean {
  return /^mermaid(?:\s|$)/i.test(language?.trim() ?? "");
}

function mermaidRuntime(): string {
  return `
  <script src="${MERMAID_SCRIPT_URL}" integrity="${MERMAID_SCRIPT_INTEGRITY}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script>
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
    mermaid.run({ nodes: document.querySelectorAll("[data-pigeon-mermaid]"), suppressErrors: true });
  </script>`;
}

function wrapMarkdownHtml(bodyHtml: string, hasMermaid: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-light.min.css" />
  <style>
    body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
    .mermaid { display: flex; justify-content: center; overflow-x: auto; }
    @media (max-width: 767px) { body { padding: 15px; } }
  </style>
</head>
<body class="markdown-body">
${bodyHtml}${hasMermaid ? mermaidRuntime() : ""}
</body>
</html>`;
}

export async function renderMarkdownPage(markdown: string): Promise<string> {
  let hasMermaid = false;
  const parser = new Marked({
    renderer: {
      code(token) {
        if (!isMermaidFence(token.lang)) {
          return false;
        }

        hasMermaid = true;
        return `<pre class="mermaid" data-pigeon-mermaid>${escapeHtml(token.text)}</pre>\n`;
      },
    },
  });

  const bodyHtml = await parser.parse(markdown);
  return wrapMarkdownHtml(bodyHtml, hasMermaid);
}
