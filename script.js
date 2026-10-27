/* Shared site enhancements: smooth scrolling, resilient reveal motion, mobile navigation. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  const menu = document.querySelector(".menu-button");
  const links = document.querySelector(".nav-links");
  if (menu && links) {
    menu.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(isOpen));
    });
    links.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      links.classList.remove("open"); menu.setAttribute("aria-expanded", "false");
    }));
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lenis;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 0.86, touchMultiplier: 1.2 });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) { event.preventDefault(); lenis.scrollTo(target, { offset: -18, duration: .9 }); }
    }));
  }

  const items = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) { items.forEach((item) => item.classList.add("visible")); return; }
  const observer = new IntersectionObserver((entries, currentObserver) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); currentObserver.unobserve(entry.target); }
  }), { rootMargin: "0px 0px -9%", threshold: .08 });
  items.forEach((item) => observer.observe(item));
});
