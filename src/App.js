import React, { useEffect, useRef, useState } from "react";
import { HtmlGenerator, parse } from "latex.js";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";
import "./App.css";
import resumeLatex from "./generated/resumeLatex";

function injectLatexAssets() {
  const baseUrl = `${window.location.origin}${process.env.PUBLIC_URL || ""}/latexjs/`;
  const assetMap = [
    ["link", `${baseUrl}css/katex.css`],
    ["link", `${baseUrl}documentclasses/article.css`],
    ["link", `${baseUrl}fonts/cmu.css`],
    ["script", `${baseUrl}js/base.js`],
  ];

  assetMap.forEach(([tagName, hrefOrSrc]) => {
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

    try {
      injectLatexAssets();

      const generator = parse(resumeLatex, {
        generator: new HtmlGenerator({ hyphenate: false }),
      });

      const page = document.createElement("article");
      page.className = "resume-page";
      page.appendChild(generator.domFragment());
      generator.applyLengthsAndGeometryToDom(page);

      target.replaceChildren(page);
      setIsRendering(false);
    } catch (error) {
      setRenderError("Failed to render the LaTeX resume.");
      setIsRendering(false);
    }

    return () => {
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
