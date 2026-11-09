"use strict";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const menuToggle = document.getElementById("menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
const searchToggle = document.getElementById("search-toggle");
const searchPanel = document.getElementById("search-panel");
const searchInput = document.getElementById("site-search");

function closeMenu() {
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
}
function closeSearch() {
  searchPanel.hidden = true;
  searchToggle.setAttribute("aria-expanded", "false");
  searchToggle.setAttribute("aria-label", "Открыть поиск по каталогу");
}
menuToggle.addEventListener("click", () => {
  const opening = mobileNav.hidden;
  closeSearch();
  mobileNav.hidden = !opening;
  menuToggle.setAttribute("aria-expanded", String(opening));
  menuToggle.setAttribute(
    "aria-label",
    opening ? "Закрыть меню" : "Открыть меню",
  );
});
mobileNav
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("resize", () => {
  if (window.innerWidth > 1080) closeMenu();
});
searchToggle.addEventListener("click", () => {
  const opening = searchPanel.hidden;
  closeMenu();
  searchPanel.hidden = !opening;
  searchToggle.setAttribute("aria-expanded", String(opening));
  searchToggle.setAttribute(
    "aria-label",
    opening ? "Закрыть поиск" : "Открыть поиск по каталогу",
  );
  if (opening) searchInput.focus();
});
document.getElementById("search-close").addEventListener("click", () => {
  closeSearch();
  searchToggle.focus();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!searchPanel.hidden) {
    closeSearch();
    searchToggle.focus();
  }
  if (!mobileNav.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});

// A native dialog provides focus containment, Escape and focus return.
const comparisonDialog = document.getElementById("comparison-dialog");
document.querySelectorAll("[data-open-comparison]").forEach((button) => {
  button.addEventListener("click", () => {
    comparisonDialog.showModal();
    document.documentElement.classList.add("dialog-open");
    if (!reduceMotion.matches)
      comparisonDialog.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 250, easing: "cubic-bezier(.22,1,.36,1)" },
      );
  });
});
comparisonDialog
  .querySelector(".dialog-close")
  .addEventListener("click", () => comparisonDialog.close());
comparisonDialog.addEventListener("close", () =>
  document.documentElement.classList.remove("dialog-open"),
);
comparisonDialog.addEventListener("click", (event) => {
  if (event.target !== comparisonDialog) return;
  const rect = comparisonDialog.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    comparisonDialog.close();
});

// Accessible tab navigation uses Left/Right, Home and End.
const ecosystemTabs = [
  ...document.querySelectorAll('.ecosystem-tabs [role="tab"]'),
];
function selectEcosystemTab(selected, focus = false) {
  ecosystemTabs.forEach((tab) => {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    panel.hidden = !active;
    if (active && !reduceMotion.matches)
      panel.animate(
        [
          { opacity: 0, transform: "translateY(4px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 230, easing: "ease-out" },
      );
  });
  if (focus) selected.focus();
}
ecosystemTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectEcosystemTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % ecosystemTabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + ecosystemTabs.length) % ecosystemTabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ecosystemTabs.length - 1;
    else return;
    event.preventDefault();
    selectEcosystemTab(ecosystemTabs[next], true);
  });
});

// Native details remain usable without JS; animate only their measured height.
const accordionState = new WeakMap();
document.querySelectorAll(".faq details").forEach((details) => {
  const summary = details.querySelector("summary");
  accordionState.set(details, { requestedOpen: details.open, animation: null });
  summary.addEventListener("click", (event) => {
    event.preventDefault();
    const state = accordionState.get(details);
    state.requestedOpen = !state.requestedOpen;
    const from = details.getBoundingClientRect().height;
    if (state.animation) {
      state.animation.cancel();
      state.animation = null;
    }
    if (reduceMotion.matches || typeof details.animate !== "function") {
      details.open = state.requestedOpen;
      return;
    }
    details.open = true;
    const to = state.requestedOpen
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height + 2;
    const animation = details.animate(
      [{ height: from + "px" }, { height: to + "px" }],
      {
        duration: 300,
        easing: "cubic-bezier(.22,1,.36,1)",
      },
    );
    state.animation = animation;
    animation.onfinish = () => {
      details.open = state.requestedOpen;
      state.animation = null;
    };
  });
});

// Content is visible by default; motion is progressive and has no no-JS blank state.
const reveals = [...document.querySelectorAll(".reveal")];
let revealObserver;
if ("IntersectionObserver" in window && !reduceMotion.matches) {
  document.documentElement.classList.add("motion-ready");
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -18px 0px" },
  );
  reveals.forEach((element) => revealObserver.observe(element));
}
reduceMotion.addEventListener("change", (event) => {
  if (event.matches) {
    document.documentElement.classList.remove("motion-ready");
    if (revealObserver) revealObserver.disconnect();
    reveals.forEach((element) => element.classList.add("is-visible"));
    document.querySelectorAll(".faq details").forEach((details) => {
      const state = accordionState.get(details);
      if (state.animation) {
        state.animation.cancel();
        state.animation = null;
        details.open = state.requestedOpen;
      }
    });
  }
});
// Category carousel: automatic playback yields to focus, hover and user preference.
const categoryHero = document.querySelector(".hero-carousel");
if (categoryHero) {
  const slides = [...categoryHero.querySelectorAll(".hero-slide")];
  const tabs = [...categoryHero.querySelectorAll(".hero-tab")];
  const pause = document.getElementById("hero-pause");
  const status = document.getElementById("hero-status");
  const currentLabel = document.getElementById("hero-current");
  const hoverDevice = window.matchMedia("(hover: hover)");
  let active = 0;
  let paused = false;
  let inView = true;
  let timer;
  let selectionSerial = 0;
  let pointerStart = null;
  const interval = 9000;
  function stopTimer() {
    window.clearTimeout(timer);
    timer = undefined;
  }
  function syncTimer() {
    stopTimer();
    pause.hidden = reduceMotion.matches;
    const blocked =
      paused ||
      reduceMotion.matches ||
      !inView ||
      document.hidden ||
      comparisonDialog.open ||
      categoryHero.contains(document.activeElement) ||
      (hoverDevice.matches && categoryHero.matches(":hover"));
    if (!blocked)
      timer = window.setTimeout(() => selectSlide(active + 1), interval);
  }
  async function selectSlide(index, manual = false) {
    const ticket = ++selectionSerial;
    const next = (index + slides.length) % slides.length;
    stopTimer();
    const image = slides[next].querySelector("img");
    image.loading = "eager";
    if (!image.complete || !image.naturalWidth)
      await image.decode().catch(() => {});
    if (ticket !== selectionSerial) return;
    const previousFocused = slides[active].contains(document.activeElement);
    active = next;
    slides.forEach((slide, i) => {
      const selected = i === active;
      slide.classList.toggle("is-active", selected);
      slide.setAttribute("aria-hidden", String(!selected));
      slide.inert = !selected;
      tabs[i].classList.toggle("is-active", selected);
      tabs[i].setAttribute("aria-selected", String(selected));
      tabs[i].tabIndex = selected ? 0 : -1;
    });
    categoryHero.dataset.theme = slides[active].dataset.theme;
    currentLabel.textContent = String(active + 1).padStart(2, "0");
    if (manual)
      status.textContent =
        tabs[active].textContent.replace(/^\s*0\d\s*/, "").trim() +
        ". Слайд " +
        (active + 1) +
        " из " +
        slides.length +
        ".";
    if (previousFocused) tabs[active].focus({ preventScroll: true });
    syncTimer();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectSlide(i, true));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (i + 1) % tabs.length;
      else if (event.key === "ArrowLeft")
        next = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus({ preventScroll: true });
      selectSlide(next, true);
    });
  });
  document
    .getElementById("hero-prev")
    .addEventListener("click", () => selectSlide(active - 1, true));
  document
    .getElementById("hero-next")
    .addEventListener("click", () => selectSlide(active + 1, true));
  pause.addEventListener("click", () => {
    paused = !paused;
    pause.setAttribute("aria-pressed", String(paused));
    pause.setAttribute(
      "aria-label",
      paused ? "Продолжить смену слайдов" : "Приостановить смену слайдов",
    );
    pause.firstElementChild.textContent = paused ? "▶" : "Ⅱ";
    syncTimer();
  });
  categoryHero.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") stopTimer();
  });
  categoryHero.addEventListener("pointerleave", syncTimer);
  categoryHero.addEventListener("focusin", stopTimer);
  categoryHero.addEventListener("focusout", () =>
    window.setTimeout(syncTimer, 0),
  );
  categoryHero.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.pointerType !== "touch" ||
        event.target.closest("a,button,input")
      )
        return;
      pointerStart = { x: event.clientX, y: event.clientY };
    },
    { passive: true },
  );
  categoryHero.addEventListener(
    "pointerup",
    (event) => {
      if (!pointerStart || event.pointerType !== "touch") return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4)
        selectSlide(active + (dx < 0 ? 1 : -1), true);
    },
    { passive: true },
  );
  categoryHero.addEventListener(
    "pointercancel",
    () => {
      pointerStart = null;
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", syncTimer);
  reduceMotion.addEventListener("change", syncTimer);
  comparisonDialog.addEventListener("close", syncTimer);
  comparisonDialog.addEventListener("toggle", syncTimer);
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncTimer();
      },
      { threshold: 0.15 },
    ).observe(categoryHero);
  categoryHero.dataset.ready = "true";
  // Fetch secondary scenes at low priority so a manual transition has no empty frame.
  slides.slice(1).forEach((slide) => {
    slide.querySelector("img").loading = "eager";
  });
  syncTimer();
}
