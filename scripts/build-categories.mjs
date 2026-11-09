import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) =>
  fs.readFileSync(path.join(root, p), "utf8").replace(/^\uFEFF/, "");
const write = (p, s) =>
  fs.writeFileSync(
    path.join(root, p),
    s.replace(/[ \t]+$/gm, "").trimEnd() + "\n",
  );
const editorial = JSON.parse(read("data/category-editorial.json"));
const research = JSON.parse(read("data/category-client-research.json"));
const home = JSON.parse(read("data/homepage-client-research.json"));
const originals = JSON.parse(read("data/product-sources.json"));
const layouts = JSON.parse(read("data/image-layout.json"));
const availability = JSON.parse(read("data/category-availability.json"));
const catalog = JSON.parse(read("data/catalog.json"));
const extras = fs.existsSync(
  path.join(root, "data/category-extra-products.json"),
)
  ? JSON.parse(read("data/category-extra-products.json"))
  : { products: [], skuFacts: {} };
Object.assign(research.skuFacts, extras.skuFacts);
for (const p of extras.products)
  if (!catalog.some((x) => x.sku === p.sku))
    catalog.push({
      ...p,
      image: typeof p.image === "string" ? p.image : p.image.file,
    });
const { categories, version } = editorial;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
const icon = (n) =>
  `<svg class="icon" aria-hidden="true"><use href="#k-${n}"/></svg>`;
const labels = {
  category: "Категория",
  offers: "Предложения",
  series: "Серия Galaxy",
  model: "Модель",
  storage: "Встроенная память",
  ram: "Оперативная память",
  screen: "Диагональ экрана",
  camera: "Основная камера",
  sim: "SIM-карты",
  color: "Цвет",
  technology: "Технология экрана",
  resolution: "Разрешение",
  refresh: "Частота обновления",
  type: "Тип устройства",
  load: "Загрузка для стирки",
  drying: "Тип сушки",
  spin: "Скорость отжима",
  network: "Связь",
  size: "Размер корпуса",
  anc: "Шумоподавление",
  bluetooth: "Версия Bluetooth",
  compatibility: "Совместимость",
  power: "Мощность",
  volume: "Объём",
  defrost: "Размораживание",
  width: "Ширина",
  runtime: "Время работы",
};
const colors = {
  Фиолетовый: "#a08ac3",
  Лавандовый: "#b9aac9",
  Чёрный: "#353638",
  Белый: "#f1f0ec",
  Серый: "#929498",
  Голубой: "#a9c4df",
  Серебристый: "#c8cbd0",
  Графитовый: "#5f6266",
  Синий: "#45678c",
  Золотистый: "#bfae89",
};
const colorFamily = (s) => {
  if (!s) return null;
  const v = s.toLowerCase().replace(/ё/g, "е");
  return /лаванд/.test(v)
    ? "Лавандовый"
    : /фиолет|purple/.test(v)
      ? "Фиолетовый"
      : /голуб/.test(v)
        ? "Голубой"
        : /черн|black/.test(v)
          ? "Чёрный"
          : /бел|white/.test(v)
            ? "Белый"
            : /серебр|silver/.test(v)
              ? "Серебристый"
              : /графит/.test(v)
                ? "Графитовый"
                : /сер[ыа]|gray|grey/.test(v)
                  ? "Серый"
                  : /син|blue/.test(v)
                    ? "Синий"
                    : /золот/.test(v)
                      ? "Золотистый"
                      : s;
};
const oldBySku = new Map();
for (const [slug, p] of Object.entries(originals)) {
  oldBySku.set(p.sku.toLowerCase(), { ...p, slug });
  for (const v of p.variants || [])
    oldBySku.set(v.sku.toLowerCase(), { ...p, ...v, slug });
}
// Verified colour/storage configurations reuse the exact galleries already present in the PDP.
for (const [slug, p] of Object.entries(originals))
  for (const v of p.variants || []) {
    if (catalog.some((x) => x.sku === v.sku)) continue;
    catalog.push({
      slug,
      name: p.shortName,
      shortName: p.shortName,
      variant: v.storage + ", " + v.color,
      price: v.price,
      sku: v.sku,
      image: v.gallery[0].file,
      url: slug + ".html?sku=" + v.sku,
      sourceUrl: v.sourceUrl,
      group: "smartphones",
    });
  }
function bounds(g) {
  const b = g.bounds;
  return Array.isArray(b)
    ? b
    : b
      ? [b.x, b.y, b.x + b.width, b.y + b.height]
      : [0, 0, g.width, g.height];
}
function factsFor(p) {
  const key = p.sku.toLowerCase(),
    old = oldBySku.get(key),
    f = research.skuFacts[key] || {};
  const base =
    old?.slug === "galaxy-s26-ultra"
      ? research.skuFacts[originals[old.slug].sku.toLowerCase()]
      : null;
  const n = { ...(base?.normalized || {}), ...(f.normalized || {}) };
  const rows = f.rawSpecs || old?.specs || [];
  const row = (re) => rows.find((x) => re.test(x.label))?.value;
  const put = (k, v) => {
    if (v !== undefined && v !== null && v !== "") n[k] = v;
  };
  if (old?.storageGb) put("storageGb", old.storageGb);
  if (old?.ramGb) put("ramGb", old.ramGb);
  if (old?.color) put("color", old.color);
  // Values below are copied from recorded spec rows; no inference from model numbers.
  const number = (key, re) => {
    if (n[key] !== undefined) return;
    const v = row(re);
    if (v && /^\d+(?:[.,]\d+)?$/.test(v.trim()))
      put(key, Number(v.replace(",", ".")));
  };
  number("refreshHz", /^Частота (обновления|смены кадров)/i);
  number("bodySizeMm", /^(Размер корпуса|Диаметр корпуса).*мм/i);
  number("powerW", /^(Выходная мощность|Мощность всасывания|Мощность),? Вт$/i);
  number(
    "runtimeMinutes",
    /^(Время работы без подзарядки|Время автономной работы|Максимальное время работы|Время работы),? мин/i,
  );
  number("widthMm", /^Ширина.*мм$/i);
  if (n.anc === undefined) put("anc", n.noiseCancellation);
  return { n, rows, conflicts: f.conflicts || [] };
}
const products = catalog.map((p) => {
  const key = p.sku.toLowerCase(),
    h = home.products[key],
    old = oldBySku.get(key),
    { n, rows, conflicts } = factsFor(p);
  let g = extras.products.find((x) => x.sku === p.sku)?.image ||
    h?.image ||
    old?.gallery?.[0] || { file: p.image, ...layouts[p.image] };
  g = { ...g, bounds: g.bounds || layouts[g.file]?.bounds };
  if (!g.width || !g.height)
    throw new Error("Missing native image dimensions: " + p.sku);
  if (!fs.existsSync(path.join(root, g.file)))
    throw new Error("Missing image: " + g.file);
  const facets = {};
  const add = (k, v) => {
    if (v !== undefined && v !== null && v !== "") facets[k] = [String(v)];
  };
  add("category", categories[p.group]?.label);
  const model = p.shortName.replace(/^Samsung /, "");
  add("model", model);
  if (p.group === "smartphones")
    add(
      "series",
      /^Galaxy Z/.test(model)
        ? "Galaxy Z"
        : /^Galaxy A/.test(model)
          ? "Galaxy A"
          : "Galaxy S",
    );
  if (n.storageGb)
    add(
      "storage",
      Number(n.storageGb) >= 1024
        ? Number(n.storageGb) / 1024 + " ТБ"
        : n.storageGb + " ГБ",
    );
  if (n.ramGb) add("ram", n.ramGb + " ГБ");
  if (n.screenInches)
    add("screen", String(n.screenInches).replace(".", ",") + "″");
  if (n.primaryCameraMp) add("camera", n.primaryCameraMp + " МП");
  add("sim", n.simType);
  add(
    "color",
    colorFamily(
      (p.group === "refrigerators" ? n.doorColor : null) ||
        n.color ||
        n.bodyColor ||
        n.colorDetail,
    ),
  );
  add(
    "technology",
    p.group === "tv"
      ? n.modelLine || n.tvType || n.screenTechnology
      : n.screenTechnology,
  );
  add("resolution", n.resolutionFormat || n.screenResolution);
  if (n.refreshHz) add("refresh", n.refreshHz + " Гц");
  if (p.group === "home")
    add(
      "type",
      n.laundryType ||
        (/сушильн/i.test(p.name) && !/стиральн/i.test(p.name)
          ? "Сушильные машины"
          : n.washerDryer === true
            ? "Стирально-сушильные машины"
            : "Стиральные машины"),
    );
  if (p.group === "refrigerators")
    add("type", n.refrigeratorType || "Холодильники");
  if (p.group === "vacuums") add("type", n.vacuumType || "Пылесосы");
  if (p.group === "accessories")
    add(
      "type",
      n.type ||
        (/чехол|case/i.test(p.name)
          ? "Чехлы"
          : /заряд|адаптер|EP-T/i.test(p.name)
            ? "Зарядные устройства"
            : undefined),
    );
  if (n.washCapacityKg) add("load", n.washCapacityKg + " кг");
  add("drying", n.dryingType);
  if (n.spinRpm) add("spin", n.spinRpm + " об/мин");
  if (n.lte !== undefined)
    add("network", n.lte ? "LTE / мобильная связь" : "Bluetooth / Wi-Fi");
  if (n.caseMm || n.bodySizeMm) add("size", (n.caseMm || n.bodySizeMm) + " мм");
  if (n.anc !== undefined)
    add(
      "anc",
      n.anc ? "С активным шумоподавлением" : "Без активного шумоподавления",
    );
  add("bluetooth", n.bluetoothVersion);
  add("compatibility", n.compatibility);
  if (n.powerW) add("power", n.powerW + " Вт");
  if (n.runtimeMinutes) add("runtime", n.runtimeMinutes + " мин");
  // Conflicting refrigerator volumes in the retailer title/table are deliberately omitted.
  if (n.volumeLiters && !conflicts.length) add("volume", n.volumeLiters + " л");
  if (n.widthMm) add("width", String(n.widthMm / 10).replace(".", ",") + " см");
  const offers = [];
  for (const [id, label] of [
    ["new", "Новинки"],
    ["hits", "Хиты продаж"],
    ["daily", "Товары дня"],
  ])
    if (h?.clientSections?.some((x) => x.section === id)) offers.push(label);
  if (p.conditionNote) offers.push("Витринный образец");
  if (offers.length) facets.offers = offers;
  const detailKeys =
    {
      smartphones: ["screen", "storage", "ram"],
      tv: ["screen", "technology", "resolution"],
      home: ["load", "drying", "spin"],
      tablets: ["screen", "storage", "ram"],
      watches: ["screen", "network", "bluetooth"],
      audio: ["anc", "bluetooth"],
      accessories: ["compatibility", "power"],
      refrigerators: ["type", "width"],
      vacuums: ["type", "power", "runtime"],
    }[p.group] || [];
  const details = detailKeys
    .filter((k) => facets[k])
    .map((k) => ({ label: labels[k], value: facets[k].join(", ") }))
    .slice(0, 3);
  return {
    ...p,
    name: p.shortName,
    image: {
      file: g.file,
      width: g.width,
      height: g.height,
      bounds: bounds(g),
    },
    facets,
    details,
    oldPrice: h?.oldPrice > p.price ? h.oldPrice : null,
    conditionNote: p.conditionNote || null,
    availability: availability.skuFacts[key]?.status || "unknown",
  };
});
function belongs(p, id) {
  return (
    id === "all" ||
    p.group === id ||
    (id === "home" && ["refrigerators", "vacuums"].includes(p.group))
  );
}
const sortOptions = (key, values) =>
  values.sort((a, b) => {
    if (key === "series")
      return (
        ["Galaxy S", "Galaxy Z", "Galaxy A"].indexOf(a) -
        ["Galaxy S", "Galaxy Z", "Galaxy A"].indexOf(b)
      );
    if (
      [
        "storage",
        "ram",
        "screen",
        "load",
        "spin",
        "power",
        "runtime",
        "width",
      ].includes(key)
    )
      return (
        parseFloat(a.replace(",", ".")) * (a.includes("ТБ") ? 1024 : 1) -
        parseFloat(b.replace(",", ".")) * (b.includes("ТБ") ? 1024 : 1)
      );
    return a.localeCompare(b, "ru", { numeric: true });
  });
const schema = (id, items) =>
  categories[id].facets
    .map((key) => ({
      key,
      label: labels[key],
      options: sortOptions(key, [
        ...new Set(items.flatMap((p) => p.facets[key] || [])),
      ]).map((value) => ({
        value,
        label: value,
        ...(key === "color" ? { color: colors[value] || "#b3b3b3" } : {}),
      })),
    }))
    .filter((f) => f.options.length);
const image = (g, alt, cls = "") =>
  `<div class="k-fit ${cls}" data-k-fit data-bounds="${json(g.bounds)}"><img src="${g.file}" width="${g.width}" height="${g.height}" alt="${esc(alt)}" loading="lazy" decoding="async"/></div>`;
function card(p, i, variants) {
  const badge = p.conditionNote
    ? "Витринный образец"
    : p.facets.offers?.includes("Новинки")
      ? "Новинка"
      : p.facets.offers?.includes("Хиты продаж")
        ? "Хит продаж"
        : "";
  const swatches = [...new Set(variants.flatMap((v) => v.facets.color || []))];
  return `<article class="k-card" data-k-card="${i}" data-sku="${p.sku}"><button type="button" class="k-tool k-favorite" data-k-favorite="${p.sku}" aria-pressed="false" aria-label="В избранное: ${esc(p.name)}">${icon("heart")}</button><a class="k-product-link" href="${esc(p.url)}" aria-label="${esc(p.name + ", " + p.variant)}">${image(p.image, p.name + " · " + p.variant)}</a><div class="k-card-copy"><h2><a href="${esc(p.url)}">${esc(p.name)}</a></h2><p class="k-card-series">${esc(p.facets.series?.[0] ? "Серия " + p.facets.series[0] : categories[p.group]?.label)}</p><div class="k-swatches" role="group" aria-label="Цвет ${esc(p.name)}">${swatches.map((color) => `<button type="button" data-color="${esc(color)}" style="--swatch:${colors[color] || "#9b9b9b"}" aria-label="${esc(color)}" aria-pressed="${p.facets.color?.includes(color) || false}" title="${esc(color)}"></button>`).join("")}</div><strong class="k-card-price">${money(p.price)}</strong><span class="k-card-version">${esc(p.variant)}</span><a class="k-configuration text-link" href="${esc(p.url)}">Подробнее <span aria-hidden="true">→</span></a><a class="button button-dark k-choose" href="${esc(p.url)}">Выбрать модель</a><label class="k-compare-check"><input type="checkbox" data-k-compare="${p.sku}"/><span class="k-checkbox" aria-hidden="true">${icon("check")}</span><span>Сравнить</span></label><span class="k-card-condition">${p.conditionNote ? "Витринный образец" : p.availability === "out-of-stock" ? "Нет в наличии" : ""}</span><span class="visually-hidden k-variant">${esc(p.variant)} · ${money(p.price)}</span></div></article>`;
}
function filterForm(id, items, facets) {
  const min = Math.min(...items.map((p) => p.price)),
    max = Math.max(...items.map((p) => p.price));
  return `<form class="k-filter-form" id="category-filters"><div class="k-filter-heading"><h2>Фильтры</h2><button type="reset" class="k-reset">Сбросить</button></div><label class="k-stock-switch"><span>В наличии</span><input type="checkbox" id="category-stock" role="switch"/><span class="k-switch-track" aria-hidden="true"></span></label><details class="k-facet" open><summary>Цена, ₽${icon("chevron")}</summary><div class="k-facet-content"><div class="k-price-inputs"><label><span>От</span><input type="number" id="price-min" name="min" min="${min}" max="${max}" step="1" value="${min}" inputmode="numeric" aria-label="Цена от"/></label><label><span>До</span><input type="number" id="price-max" name="max" min="${min}" max="${max}" step="1" value="${max}" inputmode="numeric" aria-label="Цена до"/></label></div>${min !== max ? `<div class="k-range"><div class="k-range-track"></div><div class="k-range-fill"></div><input type="range" data-range="min" min="${min}" max="${max}" value="${min}" step="1" aria-label="Минимальная цена"/><input type="range" data-range="max" min="${min}" max="${max}" value="${max}" step="1" aria-label="Максимальная цена"/></div>` : ""}</div></details>${facets.map((f, i) => `<details class="k-facet" ${i < (id === "smartphones" || id === "all" ? 2 : 1) ? "open" : ""}><summary>${f.label}${icon("chevron")}</summary><div class="k-facet-content k-options">${f.options.map((o, j) => `<label class="k-option"><input type="checkbox" name="${f.key}" value="${esc(o.value)}" data-facet="${f.key}"/><span class="k-checkbox" aria-hidden="true">${icon("check")}</span>${o.color ? `<span class="k-color" style="--swatch:${o.color}" aria-hidden="true"></span>` : ""}<span class="k-option-label">${esc(o.label)}</span><span class="k-option-count" data-option-count></span></label>`).join("")}</div></details>`).join("")}<div class="k-filter-footer"><button type="submit" class="button button-dark" data-filters-apply>Применить <span data-mobile-count>${items.length}</span></button><button type="reset" class="k-reset">Сбросить фильтры</button></div></form>`;
}
const sourceHtml = read("catalog.html");
const header = sourceHtml.match(/<header\b[\s\S]*?<\/header>/)[0];
const footer = sourceHtml.match(/<footer\b[\s\S]*?<\/footer>/)[0];
const topbar = sourceHtml.slice(
  sourceHtml.indexOf('<div class="p-topbar">'),
  sourceHtml.indexOf("<header"),
);
const commonDialog = sourceHtml.match(
  /<dialog\s+class="comparison-dialog"[\s\S]*?<\/dialog>/,
)[0];
const sprite = sourceHtml.match(/<svg\s+class="svg-sprite"[\s\S]*?<\/svg>/)[0];
const extraSprite = `<svg class="svg-sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><symbol id="i-phone" viewBox="0 0 24 24"><path d="M4 3h4l2 5-3 2a17 17 0 0 0 7 7l2-3 5 2v4c0 2-4 2-7 0A25 25 0 0 1 4 10C2 7 2 3 4 3Z"/></symbol><symbol id="k-heart" viewBox="0 0 24 24"><path d="M20.5 4.5a5.3 5.3 0 0 0-7.5 0L12 5.6l-1.1-1.1a5.3 5.3 0 0 0-7.5 7.5L12 21l8.5-9a5.3 5.3 0 0 0 0-7.5Z"/></symbol><symbol id="k-compare" viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20V7"/></symbol><symbol id="k-cart" viewBox="0 0 24 24"><path d="M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></symbol><symbol id="k-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol><symbol id="k-filter" viewBox="0 0 24 24"><path d="M3 7h18M3 17h18"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/></symbol><symbol id="k-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol><symbol id="k-search" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></symbol></svg>`;
for (const [id, c] of Object.entries(categories)) {
  const items = products.filter((p) => belongs(p, id)),
    facets = schema(id, items),
    quick = facets.find((f) => f.key === c.quickFacet);
  const grouped = new Map();
  for (const p of items) {
    const key = p.group + ":" + p.name;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(p);
  }
  const modelVariants = [...grouped.values()];
  if (id === "smartphones")
    modelVariants.sort(
      (a, b) =>
        ["Galaxy S", "Galaxy Z", "Galaxy A"].indexOf(a[0].facets.series[0]) -
          ["Galaxy S", "Galaxy Z", "Galaxy A"].indexOf(b[0].facets.series[0]) ||
        b[0].price - a[0].price,
    );
  const models = modelVariants.map((variants, i) => ({
    id: String(i),
    name: variants[0].name,
    variants: variants.map((p) => p.sku),
  }));
  const quickButtons = quick
    ? `<div class="k-quick" role="group" aria-label="${quick.label}"><button type="button" data-quick="" class="is-active" aria-pressed="true">${id === "smartphones" ? "Все смартфоны" : "Все модели"}</button>${quick.options.map((o) => `<button type="button" data-quick="${esc(o.value)}" aria-pressed="false">${esc(o.label)}</button>`).join("")}</div>`
    : "";
  const guideOptions = quick?.options.slice(0, 3) || [];
  const guideCards = guideOptions
    .map((o) => {
      const p = items.find((p) => p.facets[c.quickFacet]?.includes(o.value));
      const descriptions = {
        "Galaxy S": "Возможности флагмана. Каждый день.",
        "Galaxy Z": "Больше пространства. Складной формат.",
        "Galaxy A": "Важные технологии. Разумный выбор.",
      };
      return `<button type="button" class="k-guide-card reveal" data-guide-value="${esc(o.value)}"><span><strong>${esc(o.label)}</strong><span>${esc(descriptions[o.value] || "Выберите подходящую конфигурацию.")}</span><span class="text-link">Смотреть модели →</span></span>${image(p.image, p.name)}</button>`;
    })
    .join("");
  const showcase = guideCards
    ? `<section class="k-series-guide"><h2>${id === "smartphones" ? "Какой Galaxy подойдёт вам?" : "Ваш выбор. В деталях."}</h2><div class="k-guide-grid">${guideCards}</div></section>`
    : "";
  const serviceImage = items[Math.min(1, items.length - 1)];
  const body = `<main id="main" class="k-main shell">
 <nav class="k-breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span>/</span>${id !== "all" ? '<a href="catalog.html">Каталог</a><span>/</span>' : ""}<span aria-current="page">${esc(c.label)}</span></nav>
 <div class="k-heading"><div><h1>${esc(c.title)}</h1><p>${esc(c.intro)}</p></div><div class="k-search"><label class="visually-hidden" for="category-search">Поиск по модели</label>${icon("search")}<input type="search" id="category-search" placeholder="Поиск по модели" autocomplete="off"/><button type="button" data-search-clear aria-label="Очистить поиск" hidden>×</button></div></div>
 ${
   id === "all"
     ? `<nav class="k-categories" aria-label="Категории каталога">${Object.entries(
         categories,
       )
         .map(
           ([key, x]) =>
             `<a href="${x.file}" ${key === id ? 'aria-current="page"' : ""}>${x.label}</a>`,
         )
         .join("")}</nav>`
     : quickButtons
 }
 <div class="k-shop" id="products"><aside class="k-sidebar" aria-label="Фильтры товаров"><div data-filter-desktop>${filterForm(id, items, facets)}</div><div class="k-sidebar-help"><h3>Поможем выбрать.</h3><p>Подскажем подходящую модель и ответим на вопросы.</p><a class="text-link" href="tel:88007557525">8 800 755-7525 <span aria-hidden="true">↗</span></a></div></aside>
 <section class="k-results" aria-label="Товары"><div class="k-toolbar"><div><h2 data-results-title>${id === "smartphones" ? "Все смартфоны" : "Все модели"}</h2><p data-result-count role="status" aria-live="polite">${models.length} моделей</p></div><div class="k-toolbar-actions"><button type="button" class="k-mobile-filters" data-filters-open aria-haspopup="dialog" aria-controls="k-filter-dialog">${icon("filter")}Фильтры<span data-filter-count hidden></span></button><label class="k-sort"><select id="category-sort" aria-label="Сортировка товаров"><option value="featured">Рекомендуем</option><option value="price-up">Сначала дешевле</option><option value="price-down">Сначала дороже</option><option value="name">По названию</option><option value="new">Сначала новинки</option></select>${icon("chevron")}</label><button type="button" class="button button-outline k-compare-trigger" data-compare-open>${icon("compare")}<span>Сравнение</span><span data-compare-count hidden></span></button></div></div>
 <div class="k-active-filters" data-active-filters aria-label="Выбранные фильтры"></div><div class="k-product-grid">${models
   .map((m) =>
     card(
       items.find((p) => p.sku === m.variants[0]),
       m.id,
       m.variants.map((sku) => items.find((p) => p.sku === sku)),
     ),
   )
   .join("")}</div>
 <div class="k-empty" hidden><span class="k-empty-icon">${icon("search")}</span><h2>Пока нет совпадений.</h2><p>Попробуйте изменить параметры или сбросить фильтры.</p><button class="button button-dark" type="button" data-reset-all>Сбросить фильтры</button></div><div class="k-pagination"><p data-shown-count></p><button class="button button-outline" type="button" data-show-more hidden>Показать ещё</button></div><p class="k-assortment-note">Подборка устройств. Полный ассортимент и актуальное наличие — в магазине Online Samsung.</p></section></div>
 ${showcase}
 <section class="k-service-grid" aria-label="Сервисы магазина"><a class="k-service-card reveal" href="https://online-samsung.ru/delivery" target="_blank" rel="noopener"><div><h2>Удобно получить</h2><p>Доставка и самовывоз.<br/>Выберите свой способ.</p><span class="text-link">Условия доставки ↗</span></div><svg class="icon a-service-icon" aria-hidden="true"><use href="#i-truck"/></svg></a><a class="k-service-card reveal" href="https://online-samsung.ru/service" target="_blank" rel="noopener"><div><h2>Забота об устройстве</h2><p>Гарантия, обслуживание<br/>и помощь специалистов.</p><span class="text-link">Гарантия и сервис ↗</span></div><svg class="icon a-service-icon" aria-hidden="true"><use href="#i-shield"/></svg></a></section>
 <section class="k-guide faq" id="questions"><div><h2>Всё, что важно<br/>перед покупкой.</h2><p>Ответы на популярные вопросы<br/>о технике Samsung.</p></div><div><details><summary>Как выбрать подходящую модель?<span aria-hidden="true">+</span></summary><p>Выберите параметры в фильтрах. Внутри одного параметра можно отметить несколько вариантов. Добавьте модели к сравнению, чтобы увидеть отличия рядом.</p></details><details><summary>Как выбрать конфигурацию?<span aria-hidden="true">+</span></summary><p>Укажите нужные характеристики в фильтрах. Карточка покажет подходящую версию. Нажмите «Подробнее», чтобы открыть выбранную комплектацию. Цена в карточке относится к показанной версии.</p></details><details><summary>Как уточнить наличие и доставку?<span aria-hidden="true">+</span></summary><p>Актуальные условия для выбранной версии уточняйте в магазине Online Samsung. <a class="text-link" href="https://online-samsung.ru/delivery" target="_blank" rel="noopener">Условия доставки ↗</a></p></details><details><summary>Где посмотреть полные характеристики?<span aria-hidden="true">+</span></summary><p>Нажмите на название или фотографию товара. Откроется подробная страница выбранной модели и конфигурации.</p></details></div></section></main>`;
  const dialogs = `<dialog id="k-filter-dialog" class="k-filter-dialog" aria-labelledby="k-filter-title"><div class="k-drawer-title"><h2 id="k-filter-title">Подбор по параметрам</h2><button type="button" class="k-tool" data-filters-close aria-label="Закрыть фильтры">×</button></div><div data-filter-mobile></div></dialog><div class="k-compare-bar" hidden><span data-compare-summary></span><div><button type="button" class="k-reset" data-compare-clear>Очистить</button><button type="button" class="button button-dark button-small" data-compare-open>Сравнить</button></div></div><dialog id="k-compare-dialog" class="k-compare-dialog" aria-labelledby="k-compare-title"><div class="k-drawer-title"><h2 id="k-compare-title">Всё важное — рядом.</h2><button type="button" class="k-tool" data-compare-close aria-label="Закрыть сравнение">×</button></div><div class="k-compare-content"></div></dialog>`;
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#ffffff"/><title>${esc(c.title)} — Online Samsung</title><meta name="description" content="${esc(c.title + ". Выбор по характеристикам, сравнение моделей и подходящие конфигурации.")}"/><link rel="icon" href="assets/client-logo.svg" type="image/svg+xml"/><link rel="preload" href="assets/SamsungOne-400.woff2" as="font" type="font/woff2" crossorigin/><link rel="preload" href="assets/samsung-sharp-bold.woff" as="font" type="font/woff" crossorigin/><link rel="stylesheet" href="design.css?v=${version}"/><link rel="stylesheet" href="commerce.css?v=${version}"/><link rel="stylesheet" href="product.css?v=${version}"/><link rel="stylesheet" href="category.css?v=${version}"/><noscript><style>.k-favorite,.k-swatches,.k-compare-check,.k-filter-form,.k-mobile-filters,.k-quick,.k-sort,.k-search{display:none!important}.k-sidebar{display:none!important}.k-shop{grid-template-columns:1fr!important}</style></noscript></head><body class="category-page ${models.length <= 6 ? "k-small-category" : ""}" data-category="${id}"><a class="skip-link" href="#main">Перейти к содержимому</a>${topbar}${header}${body}${footer}${commonDialog}${dialogs}${sprite}${extraSprite}<script type="application/json" id="category-data">${json({ id, categories, facets, products: items, models, labels, quickFacet: c.quickFacet || null })}</script><script src="script.js?v=${version}" defer></script><script src="commerce.js?v=${version}" defer></script><script src="category.js?v=${version}" defer></script></body></html>`;
  write(c.file, html);
}
// Keep old deep links usable, and make every visible category link open its own page.
for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  let html = read(file).replace(
    /href="catalog\.html\?category=([a-z]+)([^"]*)"/g,
    (all, key, tail) =>
      categories[key]
        ? `href="${categories[key].file}${tail ? "?" + tail.replace(/^&(?:amp;)?/, "") : ""}"`
        : all,
  );
  write(file, html);
}
write("data/category-catalog.json", JSON.stringify(products, null, 2));
console.log(
  `Built ${Object.keys(categories).length - 1} category pages + catalog; ${products.length} verified configurations.`,
);
