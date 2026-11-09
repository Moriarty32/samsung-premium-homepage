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
