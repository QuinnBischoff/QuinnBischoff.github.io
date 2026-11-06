(() => {
  const positionKey = "portfolio-project-position";
  const returnKey = "portfolio-project-return";

  function read(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key));
    } catch (error) {
      console.warn("Unable to read the portfolio return position:", error);
      return null;
    }
  }

  function write(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Unable to save the portfolio return position:", error);
    }
  }

  function validPosition(position) {
    return position && Number.isFinite(position.x) && Number.isFinite(position.y) &&
      position.x >= 0 && position.y >= 0;
  }

  const isHome = location.pathname === "/";
  const returning = isHome ? read(returnKey) : null;
  const restore = validPosition(returning) && returning.url === location.href;
  const originalURL = location.href;

  // Disable smooth scrolling for the initial cross-page jump, not in-page links.
  if (isHome && location.hash) {
    document.documentElement.style.scrollBehavior = "auto";
    if (restore) history.replaceState(history.state, "", location.pathname + location.search);
    document.addEventListener("DOMContentLoaded", () => {
      if (restore) {
        window.scrollTo({ left: returning.x, top: returning.y, behavior: "instant" });
      }
    }, { once: true });
    window.addEventListener("pageshow", () => {
      requestAnimationFrame(() => {
        if (restore) {
          history.replaceState(history.state, "", originalURL);
          window.scrollTo({ left: returning.x, top: returning.y, behavior: "instant" });
        }
        document.documentElement.style.removeProperty("scroll-behavior");
      });
    }, { once: true });
  }
  if (isHome) write(returnKey, null);
  if (location.pathname.startsWith("/projects/")) {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    if (!referrer || referrer.origin !== location.origin ||
        (referrer.pathname !== "/" && !referrer.pathname.startsWith("/projects/"))) {
      write(positionKey, null);
    }
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") ||
        (link.target && link.target !== "_self")) return;
    const target = new URL(link.href);
    if (target.origin !== location.origin) return;

    if (isHome && target.pathname.startsWith("/projects/")) {
      write(positionKey, { x: scrollX, y: scrollY });
    } else if (location.pathname.startsWith("/projects/") &&
               target.pathname === "/" &&
               ["#work", "#personal-projects"].includes(target.hash)) {
      const position = read(positionKey);
      write(returnKey, validPosition(position)
        ? { url: target.href, x: position.x, y: position.y }
        : null);
    }
  });
})();
