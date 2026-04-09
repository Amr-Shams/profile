import React, { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";
import "./App.css";
import resumeLatex from "./generated/resumeLatex";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.head.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.customElements?.get("latex-js")) {
        resolve();
        return;
      }

      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function injectLatexAssets() {
  const baseUrl = `${window.location.origin}${process.env.PUBLIC_URL || ""}/latexjs/`;
  const stylesheets = [
    ["link", `${baseUrl}css/katex.css`],
    ["link", `${baseUrl}fonts/cmu.css`],
  ];

  stylesheets.forEach(([tagName, hrefOrSrc]) => {
    const selector =
      tagName === "link"
        ? `${tagName}[href="${hrefOrSrc}"]`
        : `${tagName}[src="${hrefOrSrc}"]`;

    if (document.head.querySelector(selector)) {
      return;
    }

    const node = document.createElement(tagName);
    if (tagName === "link") {
      node.rel = "stylesheet";
      node.href = hrefOrSrc;
    } else {
      node.src = hrefOrSrc;
      node.async = false;
    }
    document.head.appendChild(node);
  });

  return {
    baseUrl,
    scriptUrl: `${baseUrl}latex.js`,
  };
}

function App() {
  const resumeRef = useRef(null);
  const [isRendering, setIsRendering] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    const target = resumeRef.current;
    if (!target) {
      return undefined;
    }

    let mounted = true;
    const { baseUrl, scriptUrl } = injectLatexAssets();

    loadScript(scriptUrl)
      .then(() => {
        if (!mounted) {
          return;
        }

        const latexElement = document.createElement("latex-js");
        latexElement.setAttribute("baseURL", baseUrl);
        latexElement.setAttribute("hyphenate", "false");
        latexElement.textContent = resumeLatex;

        target.replaceChildren(latexElement);
        setIsRendering(false);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setRenderError("Failed to render the LaTeX resume.");
        setIsRendering(false);
      });

    return () => {
      mounted = false;
      target.replaceChildren();
    };
  }, []);

  const handleDownload = async () => {
    if (!resumeRef.current) {
      return;
    }

    setIsDownloading(true);
    try {
      await html2pdf()
        .set({
          filename: "amr-abdelmaqsoud-resume.pdf",
          margin: 0,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(resumeRef.current)
        .save();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">LaTeX-driven resume</p>
        <h1>Amr Abdelmaqsoud</h1>
        <p className="lede">
          The React app is generated from the same <code>resume/cv.tex</code>
          source as the standalone HTML view.
        </p>
        <div className="actions">
          <button type="button" onClick={handleDownload} disabled={isDownloading || isRendering}>
            {isDownloading ? "Generating PDF..." : "Download PDF"}
          </button>
          <a href={`${process.env.PUBLIC_URL || ""}/resume.tex`} target="_blank" rel="noreferrer">
            View LaTeX
          </a>
        </div>
      </section>
      <section className="viewer-card">
        {isRendering ? <p className="status">Rendering LaTeX...</p> : null}
        {renderError ? <p className="status error">{renderError}</p> : null}
        <div ref={resumeRef} className="resume-output" />
      </section>
    </main>
  );
}

export default App;
