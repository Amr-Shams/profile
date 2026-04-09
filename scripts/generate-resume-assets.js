const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const texPath = path.join(root, "resume", "cv.tex");
const generatedDir = path.join(root, "src", "generated");
const publicDir = path.join(root, "public");
const latexDistDir = path.join(root, "node_modules", "latex.js", "dist");
const publicLatexDir = path.join(publicDir, "latexjs");
const legacyPdfPath = path.join(publicDir, "resume.pdf");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(source) {
  return source
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeFile(target, contents) {
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, contents);
}

const latexSource = fs.readFileSync(texPath, "utf8");
const cdnBase = "https://cdn.jsdelivr.net/gh/michael-brade/LaTeX.js@0.12.6/dist/";

writeFile(
  path.join(generatedDir, "resumeLatex.js"),
  `const resumeLatex = ${JSON.stringify(latexSource)};\n\nexport default resumeLatex;\n`,
);

writeFile(path.join(publicDir, "resume.tex"), latexSource);

writeFile(
  path.join(root, "index.html"),
  `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Amr Abdelmaqsoud | Resume</title>
    <meta
      name="description"
      content="Amr Abdelmaqsoud resume rendered directly from the LaTeX source."
    />
    <style>
      :root {
        color-scheme: light;
        --page-bg: #f3efe7;
        --panel-bg: rgba(255, 255, 255, 0.82);
        --ink: #14212b;
        --muted: #4e5c67;
        --accent: #1a5276;
        --edge: rgba(20, 33, 43, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top, rgba(26, 82, 118, 0.14), transparent 30%),
          linear-gradient(180deg, #faf8f2 0%, var(--page-bg) 100%);
      }

      main {
        width: min(1120px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 24px 0 40px;
      }

      .topbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 20px;
        padding: 16px 18px;
        border: 1px solid var(--edge);
        border-radius: 18px;
        background: var(--panel-bg);
        backdrop-filter: blur(18px);
        box-shadow: 0 18px 45px rgba(20, 33, 43, 0.08);
      }

      .title {
        margin: 0;
        font-size: clamp(1.1rem, 2vw, 1.5rem);
      }

      .subtitle {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 0.95rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 11px 16px;
        background: var(--accent);
        color: #fff;
        font: inherit;
        text-decoration: none;
        cursor: pointer;
      }

      .button.secondary {
        background: #e6edf2;
        color: var(--ink);
      }

      .resume-shell {
        padding: 18px;
        border-radius: 28px;
        border: 1px solid rgba(20, 33, 43, 0.08);
        background: rgba(255, 255, 255, 0.66);
        box-shadow: 0 28px 70px rgba(20, 33, 43, 0.12);
        overflow: auto;
      }

      latex-js {
        display: block;
        min-width: 800px;
      }
    </style>
    <script src="${cdnBase}latex.js"></script>
  </head>
  <body>
    <main>
      <section class="topbar">
        <div>
          <h1 class="title">Amr Abdelmaqsoud Resume</h1>
          <p class="subtitle">Static HTML generated from <code>resume/cv.tex</code>.</p>
        </div>
        <div class="actions">
          <a class="button" href="./public/resume.tex">Open LaTeX</a>
          <button class="button secondary" type="button" onclick="window.print()">Print / Save PDF</button>
        </div>
      </section>
      <section class="resume-shell">
        <latex-js baseURL="${cdnBase}" hyphenate="false">${escapeHtml(latexSource)}</latex-js>
      </section>
    </main>
  </body>
</html>
`,
);

if (fs.existsSync(latexDistDir)) {
  fs.rmSync(publicLatexDir, { recursive: true, force: true });
  fs.cpSync(latexDistDir, publicLatexDir, { recursive: true });
}

if (fs.existsSync(legacyPdfPath)) {
  fs.rmSync(legacyPdfPath, { force: true });
}
