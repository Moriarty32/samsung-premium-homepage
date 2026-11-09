(() => {
  "use strict";
  const node = document.getElementById("category-data");
  if (!node) return;
  const { id, categories, facets, products, models, labels, quickFacet } =
    JSON.parse(node.textContent);
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  const normalize = (s) =>
    String(s)
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[\s–—-]+/g, " ");
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const plural = (n, one, few, many) =>
    n % 10 === 1 && n % 100 !== 11
      ? one
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
        ? few
        : many;
  let noticeTimer;
  const notice = document.createElement("div");
  notice.className = "k-notice";
  notice.hidden = true;
  notice.setAttribute("aria-hidden", "true");
  document.body.append(notice);
  const announce = (s) => {
    window.SamsungCart?.announce(s);
    if (/^(Отметьте|Можно сравнить|Сравнивайте|Браузер)/.test(s)) {
      notice.textContent = s;
      notice.hidden = false;
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => (notice.hidden = true), 4800);
      if (!reduced.matches)
        notice.animate(
          [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 260, easing: "ease-out" },
        );
    }
  };
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const cards = new Map(
    models.map((m) => [m.id, $(`[data-k-card="${m.id}"]`)]),
  );
  const selected = new Map(models.map((m) => [m.id, m.variants[0]]));
  const minPrice = Math.min(...products.map((p) => p.price)),
    maxPrice = Math.max(...products.map((p) => p.price));
  const form = $("#category-filters"),
    search = $("#category-search"),
    sort = $("#category-sort");
  const priceMin = $("#price-min"),
    priceMax = $("#price-max");
  const drawer = $("#k-filter-dialog"),
    compareDialog = $("#k-compare-dialog");
  const desktopFilter = $("[data-filter-desktop]"),
    mobileFilter = $("[data-filter-mobile]");
  const grid = $(".k-product-grid");
  let previousOrder = "";
  let limit = 15,
    visibleModels = [],
    queryTimer;
  let state = {
    stock: false,
    q: "",
    sort: "featured",
    min: minPrice,
    max: maxPrice,
    filters: {},
  };
  const legacy = new URLSearchParams(location.search).get("category");
  if (id === "all" && categories[legacy] && legacy !== "all") {
    const dest = new URL(categories[legacy].file, location.href);
    dest.search = location.search;
    dest.searchParams.delete("category");
    location.replace(dest);
    return;
  }
  const readStored = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  };
  const saveStored = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      announce("Браузер не разрешает сохранить выбор.");
      return false;
    }
  };
  const FAVORITES = "samsung-demo-favorites-v1",
    COMPARE = "samsung-category-compare-v1-" + id;
  const favoriteSkus = () => {
    const a = readStored(FAVORITES, []);
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  };
  let compared = readStored(COMPARE, []);
  compared = Array.isArray(compared)
    ? compared.filter((x) => bySku.has(x)).slice(0, 3)
    : [];
  if (compared.length)
    compared = compared.filter(
      (s) => bySku.get(s).group === bySku.get(compared[0]).group,
    );
  function fit(box) {
    const im = box.querySelector("img");
    if (!im) return;
    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const b = JSON.parse(box.dataset.bounds),
      w = Number(im.getAttribute("width")),
      h = Number(im.getAttribute("height"));
    const base = Math.min(r.width / w, r.height / h),
      scale = Math.min(
        (r.width * 0.87) / ((b[2] - b[0]) * base),
        (r.height * 0.9) / ((b[3] - b[1]) * base),
        6,
      );
    box.style.setProperty("--fit-scale", scale);
    box.style.setProperty(
      "--fit-x",
      (w / 2 - (b[0] + b[2]) / 2) * base * scale + "px",
    );
    box.style.setProperty(
      "--fit-y",
      (h / 2 - (b[1] + b[3]) / 2) * base * scale + "px",
    );
  }
  const observer =
    "ResizeObserver" in window
      ? new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)))
      : null;
  function observeImages(scope = document) {
    scope.querySelectorAll("[data-k-fit]").forEach((box) => {
      fit(box);
      observer?.observe(box);
    });
  }
  observeImages();
  if (!observer) addEventListener("resize", () => observeImages());
  function readUrl() {
    const p = new URLSearchParams(location.search),
      s = {
        stock: p.get("inStock") === "1",
        q: p.get("q") || "",
        sort: p.get("sort") || "featured",
        min: minPrice,
        max: maxPrice,
        filters: {},
      };
    if (![...sort.options].some((o) => o.value === s.sort)) s.sort = "featured";
    for (const f of facets) {
      const values = p
        .getAll(f.key)
        .filter((v) => f.options.some((o) => o.value === v));
      if (values.length) s.filters[f.key] = [...new Set(values)];
    }
    for (const key of ["min", "max"]) {
      const value = p.get(key);
      if (value !== null && Number.isFinite(Number(value)))
        s[key] = Math.max(minPrice, Math.min(maxPrice, Number(value)));
    }
    if (s.min > s.max) [s.min, s.max] = [s.max, s.min];
    if (
      id === "all" &&
      ["mobile", "wearables", "extras"].includes(p.get("category"))
    ) {
      const ids =
        p.get("category") === "mobile"
          ? ["smartphones", "tablets", "watches", "audio"]
          : p.get("category") === "extras"
            ? ["watches", "audio", "accessories"]
            : ["watches", "audio"];
      s.filters.category = ids.map((k) => categories[k].label);
    }
    state = s;
    syncForm();
  }
  function syncForm() {
    $("#category-stock").checked = state.stock;
    search.value = state.q;
    sort.value = state.sort;
    priceMin.value = state.min;
    priceMax.value = state.max;
    $$("[data-facet]").forEach(
      (input) =>
        (input.checked =
          state.filters[input.dataset.facet]?.includes(input.value) || false),
    );
    for (const input of $$("[data-range]"))
      input.value = state[input.dataset.range];
    syncRanges();
  }
  function syncRanges() {
    const range = $(".k-range");
    if (!range) return;
    const span = maxPrice - minPrice;
    range.style.setProperty(
      "--range-left",
      ((state.min - minPrice) / span) * 100 + "%",
    );
    range.style.setProperty(
      "--range-right",
      ((maxPrice - state.max) / span) * 100 + "%",
    );
  }
  function writeUrl() {
    const u = new URL(location.href);
    for (const key of [
      "q",
      "sort",
      "min",
      "max",
      "category",
      "inStock",
      ...facets.map((f) => f.key),
    ])
      u.searchParams.delete(key);
    if (state.q) u.searchParams.set("q", state.q);
    if (state.stock) u.searchParams.set("inStock", "1");
    if (state.sort !== "featured") u.searchParams.set("sort", state.sort);
    if (state.min !== minPrice) u.searchParams.set("min", String(state.min));
    if (state.max !== maxPrice) u.searchParams.set("max", String(state.max));
    for (const f of facets)
      for (const v of state.filters[f.key] || [])
        u.searchParams.append(f.key, v);
    history.replaceState(null, "", u);
  }
  function matches(p, skip) {
    if (state.stock && p.availability !== "in-stock") return false;
    if (p.price < state.min || p.price > state.max) return false;
    if (
      state.q &&
      !normalize(p.name + " " + p.variant + " " + p.sku).includes(
        normalize(state.q),
      )
    )
      return false;
    return Object.entries(state.filters).every(
      ([key, values]) =>
        key === skip ||
        !values.length ||
        values.some((v) => p.facets[key]?.includes(v)),
    );
  }
  function countModels(list) {
    return new Set(list.map((p) => p.group + ":" + p.name)).size;
  }
  function updateOptions() {
    for (const facet of facets) {
      const pool = products.filter((p) => matches(p, facet.key));
      for (const input of form.querySelectorAll(
        `[data-facet="${facet.key}"]`,
      )) {
        const count = countModels(
          pool.filter((p) => p.facets[facet.key]?.includes(input.value)),
        );
        input
          .closest(".k-option")
          .querySelector("[data-option-count]").textContent = count;
        input.disabled = !count && !input.checked;
      }
    }
  }
  function updateTools() {
    const favorites = favoriteSkus();
    for (const card of cards.values()) {
      const p = bySku.get(card.dataset.sku),
        fav = card.querySelector("[data-k-favorite]"),
        cmp = card.querySelector("[data-k-compare]");
      fav.dataset.kFavorite = p.sku;
      fav.setAttribute("aria-pressed", String(favorites.includes(p.sku)));
      fav.setAttribute(
        "aria-label",
        (favorites.includes(p.sku)
          ? "Удалить из избранного: "
          : "В избранное: ") + p.name,
      );
      cmp.dataset.kCompare = p.sku;
      cmp.checked = compared.includes(p.sku);
      cmp.setAttribute("aria-label", "Сравнить " + p.name + ", " + p.variant);
    }
    $$("[data-compare-count]").forEach((n) => {
      n.textContent = compared.length;
      n.hidden = !compared.length;
    });
    $(".k-compare-bar").hidden = !compared.length;
    $("[data-compare-summary]").textContent =
      compared.length +
      " " +
      plural(compared.length, "модель", "модели", "моделей") +
      " к сравнению";
  }
  function updateCard(model, p, available) {
    const card = cards.get(model.id),
      previous = card.dataset.sku;
    card.dataset.sku = p.sku;
    selected.set(model.id, p.sku);
    for (const a of card.querySelectorAll("a")) a.href = p.url;
    const visual = card.querySelector(".k-product-link"),
      box = visual.querySelector("[data-k-fit]"),
      im = box.querySelector("img");
    visual.setAttribute("aria-label", p.name + ", " + p.variant);
    im.alt = p.name + " · " + p.variant;
    if (im.getAttribute("src") !== p.image.file) {
      im.src = p.image.file;
      im.width = p.image.width;
      im.height = p.image.height;
      box.dataset.bounds = JSON.stringify(p.image.bounds);
      if (!reduced.matches)
        im.animate([{ opacity: 0.35 }, { opacity: 1 }], {
          duration: 280,
          easing: "ease-out",
        });
    }
    card.querySelector(".k-variant").textContent =
      p.variant + " · " + money(p.price);
    card.querySelector(".k-card-condition").textContent = p.conditionNote
      ? "Витринный образец"
      : p.availability === "out-of-stock"
        ? "Нет в наличии"
        : "";
    for (const swatch of card.querySelectorAll("[data-color]")) {
      swatch.setAttribute(
        "aria-pressed",
        String(p.facets.color?.includes(swatch.dataset.color) || false),
      );
      swatch.disabled = !available.some((v) =>
        v.facets.color?.includes(swatch.dataset.color),
      );
    }
    fit(box);
    // Changing a selected colour keeps the same model in the comparison.
    if (previous !== p.sku && compared.includes(previous)) {
      compared = compared.map((s) => (s === previous ? p.sku : s));
      saveStored(COMPARE, compared);
    }
  }
  function activeFilters() {
    const box = $("[data-active-filters]");
    box.replaceChildren();
    const add = (label, remove) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "k-chip";
      b.append(document.createTextNode(label + " "));
      const x = document.createElement("span");
      x.textContent = "×";
      x.setAttribute("aria-hidden", "true");
      b.append(x);
      b.setAttribute("aria-label", "Убрать фильтр: " + label);
      b.addEventListener("click", remove);
      box.append(b);
    };
    for (const [key, values] of Object.entries(state.filters))
      for (const value of values)
        add(value, () => {
          state.filters[key] = state.filters[key].filter((v) => v !== value);
          syncForm();
          render();
        });
    if (state.min !== minPrice || state.max !== maxPrice)
      add(money(state.min) + " — " + money(state.max), () => {
        state.min = minPrice;
        state.max = maxPrice;
        syncForm();
        render();
      });
    if (state.stock)
      add("В наличии", () => {
        state.stock = false;
        syncForm();
        render();
      });
    if (state.q)
      add("Поиск: " + state.q, () => {
        state.q = "";
        search.value = "";
        render();
        search.focus();
      });
  }
  function render(resetLimit = true, url = true) {
    if (resetLimit) limit = 15;
    const matching = products.filter((p) => matches(p)),
      pool = new Set(matching.map((p) => p.sku));
    visibleModels = models.filter((m) => m.variants.some((s) => pool.has(s)));
    const picks = new Map();
    for (const m of visibleModels) {
      const available = m.variants
          .filter((s) => pool.has(s))
          .map((s) => bySku.get(s)),
        p = available.find((p) => p.sku === selected.get(m.id)) || available[0];
      picks.set(m.id, p);
      updateCard(m, p, available);
    }
    visibleModels.sort((a, b) => {
      const x = picks.get(a.id),
        y = picks.get(b.id);
      if (state.sort === "price-up") return x.price - y.price;
      if (state.sort === "price-down") return y.price - x.price;
      if (state.sort === "name")
        return a.name.localeCompare(b.name, "ru", { numeric: true });
      if (state.sort === "new")
        return (
          Number(y.facets.offers?.includes("Новинки") || false) -
            Number(x.facets.offers?.includes("Новинки") || false) ||
          Number(a.id) - Number(b.id)
        );
      return Number(a.id) - Number(b.id);
    });
    const nextOrder =
      visibleModels.map((m) => m.id + ":" + selected.get(m.id)).join("|") +
      ":" +
      limit;
    const animate = nextOrder !== previousOrder;
    previousOrder = nextOrder;
    for (const card of cards.values()) card.hidden = true;
    for (const [index, m] of visibleModels.entries()) {
      const card = cards.get(m.id);
      grid.append(card);
      card.hidden = index >= limit;
      if (index < limit && !reduced.matches && animate) {
        card.getAnimations().forEach((a) => a.cancel());
        card.animate(
          [
            { opacity: 0.25, transform: "translateY(9px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 390,
            delay: Math.min(index, 8) * 22,
            easing: "cubic-bezier(.22,1,.36,1)",
          },
        );
      }
      if (index < limit) fit(card.querySelector("[data-k-fit]"));
    }
    const count = visibleModels.length;
    $("[data-result-count]").textContent =
      count +
      " " +
      plural(count, "модель", "модели", "моделей") +
      " · " +
      matching.length +
      " " +
      plural(matching.length, "конфигурация", "конфигурации", "конфигураций");
    $("[data-mobile-count]").textContent = count;
    $("[data-shown-count]").textContent = count
      ? "Показано " +
        Math.min(limit, count) +
        " из " +
        count +
        " " +
        plural(count, "модели", "моделей", "моделей")
      : "";
    $("[data-show-more]").hidden = count <= limit;
    $(".k-pagination").hidden = !count;
    $(".k-empty").hidden = !!count;
    const filtersCount =
      Object.values(state.filters).reduce((n, a) => n + a.length, 0) +
      Number(state.min !== minPrice || state.max !== maxPrice) +
      Number(state.stock);
    $("[data-filter-count]").textContent = filtersCount;
    $("[data-filter-count]").hidden = !filtersCount;
    for (const b of $$("[data-quick]")) {
      const values = state.filters[quickFacet] || [],
        active = b.dataset.quick
          ? values.length === 1 && values[0] === b.dataset.quick
          : !values.length;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    const quickValues = state.filters[quickFacet] || [];
    $("[data-results-title]").textContent =
      quickValues.length === 1
        ? quickValues[0]
        : id === "smartphones"
          ? "Все смартфоны"
          : "Все модели";
    $("[data-search-clear]").hidden = !state.q;
    activeFilters();
    updateOptions();
    updateTools();
    if (url) writeUrl();
  }
  function setPrice(target) {
    const isMin = target === priceMin || target.dataset.range === "min",
      key = isMin ? "min" : "max";
    const parsed = Number(target.value);
    if (target.value === "" || !Number.isFinite(parsed)) {
      syncForm();
      return;
    }
    state[key] = Math.round(Math.max(minPrice, Math.min(maxPrice, parsed)));
    if (state.min > state.max) state[key] = isMin ? state.max : state.min;
    syncForm();
    render();
  }
  form.addEventListener("change", (e) => {
    if (e.target.id === "category-stock") {
      state.stock = e.target.checked;
      render();
      return;
    }
    if (e.target.matches("[data-facet]")) {
      const key = e.target.dataset.facet;
      state.filters[key] = [
        ...form.querySelectorAll(`[data-facet="${key}"]:checked`),
      ].map((x) => x.value);
      render();
    } else if (e.target === priceMin || e.target === priceMax)
      setPrice(e.target);
  });
  $$("[data-range]").forEach((r) => {
    r.addEventListener("input", () => setPrice(r));
    r.addEventListener("pointerdown", () => {
      for (const other of $$("[data-range]"))
        other.style.zIndex = other === r ? "2" : "1";
    });
  });
  function reset() {
    state = {
      stock: false,
      q: "",
      sort: state.sort,
      min: minPrice,
      max: maxPrice,
      filters: {},
    };
    syncForm();
    render();
  }
  form.addEventListener("reset", (e) => {
    e.preventDefault();
    reset();
  });
  $("[data-reset-all]").addEventListener("click", reset);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (drawer.open) drawer.close();
    $("#products").scrollIntoView({
      behavior: reduced.matches ? "instant" : "smooth",
      block: "start",
    });
  });
  search.addEventListener("input", () => {
    clearTimeout(queryTimer);
    queryTimer = setTimeout(() => {
      state.q = search.value.trim();
      render();
    }, 120);
  });
  $("[data-search-clear]").addEventListener("click", () => {
    clearTimeout(queryTimer);
    state.q = "";
    search.value = "";
    render();
    search.focus();
  });
  sort.addEventListener("change", () => {
    state.sort = sort.value;
    render();
  });
  function quick(value) {
    if (quickFacet) {
      state.filters[quickFacet] = value ? [value] : [];
      syncForm();
      render();
    }
  }
  $$("[data-quick]").forEach((b) =>
    b.addEventListener("click", () => quick(b.dataset.quick)),
  );
  $$("[data-guide-value]").forEach((b) =>
    b.addEventListener("click", () => {
      quick(b.dataset.guideValue);
      $("#products").scrollIntoView({
        behavior: reduced.matches ? "instant" : "smooth",
      });
    }),
  );
  $("[data-show-more]").addEventListener("click", () => {
    const first = visibleModels[limit];
    limit += 15;
    render(false);
    if (first) {
      const card = cards.get(first.id);
      card.querySelector("h2 a").focus({ preventScroll: true });
      card.scrollIntoView({
        behavior: reduced.matches ? "instant" : "smooth",
        block: "nearest",
      });
    }
  });
  for (const model of models) {
    const card = cards.get(model.id);
    card.querySelector("[data-k-favorite]").addEventListener("click", () => {
      const sku = card.dataset.sku,
        saved = favoriteSkus(),
        active = saved.includes(sku);
      saveStored(
        FAVORITES,
        active ? saved.filter((s) => s !== sku) : [...saved, sku],
      );
      updateTools();
      announce(
        active ? "Товар удалён из избранного." : "Товар сохранён в избранном.",
      );
    });
    for (const b of card.querySelectorAll("[data-color]"))
      b.addEventListener("click", () => {
        const available = model.variants
            .map((s) => bySku.get(s))
            .filter((p) => matches(p)),
          p = available.find((p) => p.facets.color?.includes(b.dataset.color));
        if (p) {
          updateCard(model, p, available);
          updateTools();
          announce(p.name + ", " + p.variant + ", " + money(p.price));
        }
      });
    card.querySelector("[data-k-compare]").addEventListener("change", (e) => {
      const sku = card.dataset.sku,
        p = bySku.get(sku);
      if (e.target.checked) {
        if (compared.length >= 3) {
          announce("Можно сравнить до трёх моделей.");
          updateTools();
          return;
        }
        if (compared.length && bySku.get(compared[0]).group !== p.group) {
          announce(
            "Сравнивайте устройства одной категории. Очистите текущий список, чтобы выбрать другую.",
          );
          updateTools();
          return;
        }
        compared.push(sku);
      } else compared = compared.filter((s) => s !== sku);
      saveStored(COMPARE, compared);
      updateTools();
    });
  }
  const mobile = matchMedia("(max-width: 1023px)");
  function positionFilters() {
    if (!mobile.matches && drawer.open) drawer.close();
    (mobile.matches ? mobileFilter : desktopFilter).append(form);
  }
  positionFilters();
  mobile.addEventListener("change", positionFilters);
  function showDialog(d) {
    d.showModal();
    document.documentElement.classList.add("dialog-open");
    if (!reduced.matches)
      d.animate(
        [
          {
            opacity: 0,
            transform: d === drawer ? "translateX(35px)" : "translateY(18px)",
          },
          { opacity: 1, transform: "translate(0)" },
        ],
        { duration: 340, easing: "cubic-bezier(.22,1,.36,1)" },
      );
  }
  $("[data-filters-open]").addEventListener("click", () => showDialog(drawer));
  $("[data-filters-close]").addEventListener("click", () => drawer.close());
  for (const d of [drawer, compareDialog]) {
    d.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]"))
        document.documentElement.classList.remove("dialog-open");
    });
    d.addEventListener("click", (e) => {
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          d.close();
      }
    });
  }
  function comparisonHtml() {
    const list = compared.map((s) => bySku.get(s));
    const keys = [
      ...new Set(list.flatMap((p) => Object.keys(p.facets))),
    ].filter((k) => !["offers", "category", "model", "series"].includes(k));
    const im = (p) =>
      `<div class="k-fit" data-k-fit data-bounds="${JSON.stringify(p.image.bounds)}"><img src="${p.image.file}" width="${p.image.width}" height="${p.image.height}" alt="${esc(p.name)}"/></div>`;
    return `<table class="k-compare-table"><thead><tr><th scope="col">Характеристики</th>${list.map((p) => `<th scope="col">${im(p)}<h3>${esc(p.name)}</h3><p>${esc(p.variant)}${p.conditionNote ? " · Витринный образец" : ""}</p><strong>${money(p.price)}</strong><br/><a class="text-link" href="${esc(p.url)}">Выбрать модель ↗</a><button type="button" class="k-remove-compare" data-remove-compare="${p.sku}">Убрать из сравнения</button></th>`).join("")}</tr></thead><tbody>${keys.map((key) => `<tr><th scope="row">${esc(labels[key] || key)}</th>${list.map((p) => `<td>${esc(p.facets[key]?.join(", ") || "—")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  function fillComparison() {
    const box = $(".k-compare-content");
    observer &&
      box
        .querySelectorAll("[data-k-fit]")
        .forEach((b) => observer.unobserve(b));
    box.innerHTML = comparisonHtml();
    observeImages(box);
    box.querySelectorAll("[data-remove-compare]").forEach((b) =>
      b.addEventListener("click", () => {
        compared = compared.filter((s) => s !== b.dataset.removeCompare);
        saveStored(COMPARE, compared);
        updateTools();
        if (compared.length) {
          fillComparison();
          $("[data-compare-close]").focus();
        } else compareDialog.close();
      }),
    );
  }
  $$("[data-compare-open]").forEach((b) =>
    b.addEventListener("click", () => {
      if (compared.length < 2) {
        announce(
          "Отметьте «Сравнить» у двух или трёх моделей одной категории.",
        );
        return;
      }
      fillComparison();
      showDialog(compareDialog);
      observeImages($(".k-compare-content"));
    }),
  );
  $("[data-compare-close]").addEventListener("click", () =>
    compareDialog.close(),
  );
  $("[data-compare-clear]").addEventListener("click", () => {
    compared = [];
    saveStored(COMPARE, compared);
    updateTools();
  });
  addEventListener("storage", (e) => {
    if (e.key === FAVORITES) updateTools();
  });
  addEventListener("popstate", () => {
    readUrl();
    render(true, false);
  });
  for (const a of $$(".desktop-nav a,.mobile-nav a"))
    if (a.getAttribute("href") === categories[id].file)
      a.setAttribute("aria-current", "page");
  readUrl();
  render(true, false);
  document.fonts?.ready.then(() => observeImages());
})();
