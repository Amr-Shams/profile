document.addEventListener("keydown", function (event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

  var key = event.key.toLowerCase();
  var state = window.__keys || "";

  function setState(next) {
    window.__keys = next;
    document.body.dataset.keyState = next;
    clearTimeout(window.__keyTimer);
    if (next) {
      window.__keyTimer = setTimeout(function () { setState(""); }, 1200);
    }
  }

  if (key === "g") {
    setState("g");
    return;
  }

  if (state === "g") {
    setState("");
    if (key === "a") window.location.hash = "about";
    if (key === "b") window.location.hash = "blog";
    return;
  }

  setState("");

  if (key === "h") window.location.href = "https://github.com/Amr-Shams";
  if (key === "l") window.location.href = "https://www.linkedin.com/in/amr-abdelmaqsoud-b5107519b/";
  if (key === "x") window.location.href = "https://x.com/AMR_SHAMS07";
  if (key === "e") window.location.href = "mailto:amr.shams2015.as@gmail.com";
  if (key === "c") window.location.href = "/resume.pdf";
});
