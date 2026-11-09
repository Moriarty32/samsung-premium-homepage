(() => {
  "use strict";
  const dataNode = document.getElementById("home-data");
  if (!dataNode) return;
  const { products } = JSON.parse(dataNode.textContent);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  document.documentElement.classList.add("merch-ready");
  const FAVORITES = "samsung-demo-favorites-v1";
  const favorites = () => {
    try {
      const v = JSON.parse(localStorage.getItem(FAVORITES) || "[]");
      return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  };
  function syncFavorites() {
    const saved = favorites();
    $$("[data-home-favorite]").forEach((b) => {
      const selected = saved.includes(b.dataset.homeFavorite);
      const p = products[b.dataset.homeFavorite.toLowerCase()];
      b.setAttribute("aria-pressed", String(selected));
      b.setAttribute(
        "aria-label",
        (selected ? "Удалить из избранного: " : "В избранное: ") + p.name,
      );
    });
  }
  $$("[data-home-favorite]").forEach((b) =>
    b.addEventListener("click", () => {
      const sku = b.dataset.homeFavorite;
      let saved = favorites();
      const active = saved.includes(sku);
      saved = active ? saved.filter((x) => x !== sku) : [...saved, sku];
      try {
        localStorage.setItem(FAVORITES, JSON.stringify(saved));
        syncFavorites();
        window.SamsungCart?.announce(
          active
            ? "Товар удалён из избранного."
            : "Товар сохранён в избранном.",
        );
      } catch {
        window.SamsungCart?.announce(
          "Браузер не разрешает сохранить избранное.",
        );
      }
    }),
  );
  syncFavorites();
  window.addEventListener("storage", (e) => {
    if (e.key === FAVORITES) syncFavorites();
  });
  $$("[data-home-add]").forEach((b) =>
    b.addEventListener("click", () => {
      const p = products[b.dataset.homeAdd.toLowerCase()];
      window.SamsungCart?.add({
        sku: p.sku,
        name: p.name,
        variant: p.variant + (p.conditionNote ? " · Витринный образец" : ""),
        price: p.price,
        image: p.image.file,
        url: p.url,
        sourceUrl: p.sourceUrl,
      });
    }),
  );

  function fitImage(box) {
    const im = box.querySelector("img");
    if (!im) return;
    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const bounds = JSON.parse(box.dataset.bounds),
      w = Number(im.getAttribute("width")),
      h = Number(im.getAttribute("height"));
    const base = Math.min(r.width / w, r.height / h);
    const scale = Math.min(
      (r.width * 0.83) / ((bounds[2] - bounds[0]) * base),
      (r.height * 0.85) / ((bounds[3] - bounds[1]) * base),
      5,
    );
    box.style.setProperty("--fit-scale", scale);
    box.style.setProperty(
      "--fit-x",
      (w / 2 - (bounds[0] + bounds[2]) / 2) * base * scale + "px",
    );
    box.style.setProperty(
      "--fit-y",
      (h / 2 - (bounds[1] + bounds[3]) / 2) * base * scale + "px",
    );
  }
  const fitObserver =
    "ResizeObserver" in window
      ? new ResizeObserver((entries) =>
          entries.forEach((e) => fitImage(e.target)),
        )
      : null;
  $$("[data-fit-image]").forEach((box) => {
    fitImage(box);
    fitObserver?.observe(box);
  });
  if (!fitObserver)
    window.addEventListener("resize", () =>
      $$("[data-fit-image]").forEach(fitImage),
    );

  $$(".m-collection").forEach((section) => {
    const tabs = [...section.querySelectorAll('[role="tab"]')];
    const frame = section.querySelector(".m-collection-panels");
    const panels = [...section.querySelectorAll(".m-collection-panel")];
    let lastWidth = 0;
    function keepHeight(force = false) {
      const width = frame.getBoundingClientRect().width;
      if (!width || (!force && Math.abs(width - lastWidth) < 0.5)) return;
      lastWidth = width;
      let height = 0;
      for (const panel of panels) {
        const hidden = panel.hidden,
          style = panel.getAttribute("style");
        panel.style.cssText += `;position:absolute;visibility:hidden;pointer-events:none;width:${width}px;`;
        panel.hidden = false;
        height = Math.max(height, panel.getBoundingClientRect().height);
        panel.hidden = hidden;
        if (style === null) panel.removeAttribute("style");
        else panel.setAttribute("style", style);
      }
      frame.style.minHeight = Math.ceil(height) + "px";
    }
    keepHeight();
    if ("ResizeObserver" in window)
      new ResizeObserver(() => keepHeight()).observe(frame);
    document.fonts?.ready.then(() => keepHeight(true));
    function select(tab, focus = false) {
      tabs.forEach((b) => {
        const active = b === tab;
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
        document.getElementById(b.getAttribute("aria-controls")).hidden =
          !active;
      });
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel.querySelectorAll("[data-fit-image]").forEach(fitImage);
      if (!reduced.matches)
        panel.querySelectorAll(".m-product-card").forEach((card, i) =>
          card.animate(
            [
              { opacity: 0, transform: "translateY(10px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 480,
              delay: i * 45,
              easing: "cubic-bezier(.22,1,.36,1)",
            },
          ),
        );
      if (focus) tab.focus({ preventScroll: true });
      const tabRect = tab.getBoundingClientRect(),
        list = tab.closest(".m-tablist"),
        listRect = list.getBoundingClientRect();
      const delta =
        tabRect.left < listRect.left
          ? tabRect.left - listRect.left
          : tabRect.right > listRect.right
            ? tabRect.right - listRect.right
            : 0;
      if (delta)
        list.scrollBy({
          left: delta,
          behavior: reduced.matches ? "instant" : "smooth",
        });
      section.querySelector("[data-collection-status]").textContent =
        tab.textContent.trim() +
        ". Товаров: " +
        panel.querySelectorAll(".m-product-card").length;
      updateRail(panel.querySelector("[data-product-rail]"));
    }
    tabs.forEach((tab, i) => {
      const warm = () =>
        document
          .getElementById(tab.getAttribute("aria-controls"))
          .querySelectorAll("img")
          .forEach((image) => {
            image.loading = "eager";
          });
      tab.addEventListener("pointerenter", warm, { passive: true });
      tab.addEventListener("focus", warm);
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (event.key === "ArrowLeft")
          next = (i - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(tabs[next], true);
      });
    });
  });
  function updateRail(rail) {
    const panel = rail.closest(".m-collection-panel");
    if (panel.hidden) return;
    const max = rail.scrollWidth - rail.clientWidth;
    panel.querySelector(".m-rail-controls").hidden = max < 3;
    panel.querySelector("[data-rail-prev]").disabled = rail.scrollLeft < 3;
    panel.querySelector("[data-rail-next]").disabled =
      rail.scrollLeft > max - 3;
  }
  const railObserver =
    "ResizeObserver" in window
      ? new ResizeObserver((entries) =>
          entries.forEach((e) => updateRail(e.target)),
        )
      : null;
  $$("[data-product-rail]").forEach((rail) => {
    const panel = rail.closest(".m-collection-panel");
    const scroll = (delta) =>
      rail.scrollBy({
        left:
          delta *
          (rail.querySelector(".m-product-card").getBoundingClientRect().width +
            parseFloat(getComputedStyle(rail).columnGap)),
        behavior: reduced.matches ? "instant" : "smooth",
      });
    panel
      .querySelector("[data-rail-prev]")
      .addEventListener("click", () => scroll(-1));
    panel
      .querySelector("[data-rail-next]")
      .addEventListener("click", () => scroll(1));
    rail.addEventListener("scroll", () => updateRail(rail), { passive: true });
    updateRail(rail);
    railObserver?.observe(rail);
  });

  const daily = $(".m-daily"),
    slides = [...daily.querySelectorAll("[data-daily-slide]")],
    stage = daily.querySelector(".m-daily-stage");
  let active = 0,
    serial = 0,
    swipe = null,
    ignoreClickUntil = 0;
  async function selectDaily(index, focusDot = false) {
    const next = (index + slides.length) % slides.length,
      ticket = ++serial;
    const image = slides[next].querySelector("img");
    image.loading = "eager";
    await image.decode().catch(() => {});
    if (ticket !== serial) return;
    active = next;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === next);
      slide.setAttribute("aria-hidden", String(i !== next));
      slide.inert = i !== next;
    });
    slides[next].querySelectorAll("[data-fit-image]").forEach(fitImage);
    daily.querySelector("[data-daily-current]").textContent = String(
      next + 1,
    ).padStart(2, "0");
    daily.querySelector("[data-daily-status]").textContent =
      `Товар ${next + 1} из ${slides.length}: ${slides[next].querySelector("h3").textContent}.`;
    if (focusDot)
      slides[next]
        .querySelector(`[data-daily-go="${next}"]`)
        .focus({ preventScroll: true });
  }
  daily
    .querySelector("[data-daily-prev]")
    .addEventListener("click", () => selectDaily(active - 1));
  daily
    .querySelector("[data-daily-next]")
    .addEventListener("click", () => selectDaily(active + 1));
  daily
    .querySelectorAll("[data-daily-go]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        selectDaily(Number(b.dataset.dailyGo), true),
      ),
    );
  stage.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    selectDaily(
      active + (event.key === "ArrowRight" ? 1 : -1),
      !!event.target.closest("[data-daily-go]"),
    );
  });
  stage.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "touch" && !event.target.closest("button"))
        swipe = { x: event.clientX, y: event.clientY };
    },
    { passive: true },
  );
  stage.addEventListener(
    "pointerup",
    (event) => {
      if (!swipe) return;
      const dx = event.clientX - swipe.x,
        dy = event.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        ignoreClickUntil = Date.now() + 600;
        selectDaily(active + (dx < 0 ? 1 : -1));
      }
    },
    { passive: true },
  );
  stage.addEventListener(
    "pointercancel",
    () => {
      swipe = null;
    },
    { passive: true },
  );
  stage.addEventListener(
    "click",
    (event) => {
      if (Date.now() < ignoreClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
})();
