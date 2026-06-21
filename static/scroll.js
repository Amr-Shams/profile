document.addEventListener("DOMContentLoaded", function () {
  var els = document.querySelectorAll(".fade-in");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { observer.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("visible"); });
  }
});
