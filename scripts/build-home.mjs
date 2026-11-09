import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) =>
  fs.readFileSync(path.join(root, p), "utf8").replace(/^\uFEFF/, "");
const write = (p, s) =>
  fs.writeFileSync(path.join(root, p), s.trimEnd() + "\n");
const data = JSON.parse(read("data/homepage-client-research.json"));
const editorial = JSON.parse(read("data/home-editorial.json"));
const oldProducts = JSON.parse(read("data/product-sources.json"));
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
const normalizeBounds = (b, w, h) =>
  Array.isArray(b)
    ? b
    : b
      ? [b.x, b.y, b.x + b.width, b.y + b.height]
      : [0, 0, w, h];
const routes = new Map();
for (const [slug, p] of Object.entries(oldProducts)) {
  routes.set(p.sku.toLowerCase(), slug + ".html");
  for (const v of p.variants || [])
    routes.set(
      v.sku.toLowerCase(),
      slug + ".html?sku=" + encodeURIComponent(v.sku),
    );
}
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
const groupNames = {
  mobile: "Мобильные",
  tv: "ТВ и аудио",
  home: "Для дома",
  accessories: "Аксессуары",
  all: "Все",
};
const groupLinks = {
  mobile: "catalog.html?category=mobile",
  tv: "catalog.html?category=tv",
  home: "catalog.html?category=home",
  accessories: "catalog.html?category=extras",
  all: "catalog.html",
};
const categoryNames = {
  smartphones: "Смартфоны",
  tv: "Телевизоры",
  home: "Техника для дома",
  tablets: "Планшеты",
  watches: "Часы",
  audio: "Наушники",
  accessories: "Аксессуары",
  refrigerators: "Холодильники",
  vacuums: "Пылесосы",
};
function category(p) {
  const c = p.category;
  return (
    {
      headphones: "audio",
      refrigerators: "refrigerators",
      fridges: "refrigerators",
      vacuums: "vacuums",
    }[c] ||
    c ||
    "accessories"
  );
}
const products = Object.fromEntries(
  Object.entries(data.products).map(([key, p]) => {
    const image = p.image;
    if (
      !image?.file ||
      !image.width ||
      !image.height ||
      !fs.existsSync(path.join(root, image.file))
    )
      throw new Error(`Missing verified image: ${key}`);
    return [
      key.toLowerCase(),
      {
        ...p,
        category: category(p),
        name: p.shortName || p.title,
        variant: (p.variant || "")
          .replace(/Гб/g, "ГБ")
          .replace(/Черный/g, "Чёрный"),
        image: {
          ...image,
          bounds: normalizeBounds(image.bounds, image.width, image.height),
        },
        url: routes.get(p.sku.toLowerCase()) || p.sourceUrl,
      },
    ];
  }),
);
function get(sku) {
  const p = products[sku.toLowerCase()];
  if (!p) throw new Error("Missing product " + sku);
  return p;
}
function image(g, alt = "", attrs = "") {
  return `<img src="${esc(g.file)}" width="${g.width}" height="${g.height}" alt="${esc(alt)}" loading="lazy" decoding="async" ${attrs}/>`;
}
function visual(g, alt, cls = "m-product-visual", url) {
  const open = url
    ? `<a href="${esc(url)}" class="${cls}" aria-label="${esc(alt)}"`
    : `<div class="${cls}"`;
  return `${open} data-fit-image data-bounds="${esc(json(normalizeBounds(g.bounds, g.width, g.height)))}">${image(g, alt)}</${url ? "a" : "div"}>`;
}
function favorite(p) {
  return `<button class="m-favorite" type="button" data-home-favorite="${esc(p.sku)}" aria-label="В избранное: ${esc(p.name)}" aria-pressed="false">${icon("m-heart")}</button>`;
}
function price(p, cls = "m-price") {
  return `<div class="${cls}">${p.oldPrice > p.price ? `<del>${money(p.oldPrice)}</del>` : ""}<strong>${money(p.price)}</strong></div>`;
}
function condition(p) {
  return p.conditionNote ? '<p class="m-condition">Витринный образец</p>' : "";
}
function card(p) {
  return `<article class="m-product-card" data-home-product="${esc(p.sku)}">${favorite(p)}${visual(p.image, p.name + " · " + p.variant, "m-product-visual", p.url)}<div class="m-product-copy"><p class="m-product-type">${esc(categoryNames[p.category] || "Samsung")}</p><h3><a href="${esc(p.url)}">${esc(p.name)}</a></h3><p class="m-product-variant">${esc(p.variant)}</p>${condition(p)}<div class="m-product-purchase">${price(p)}<button class="button button-dark m-cart-button" type="button" data-home-add="${esc(p.sku)}" aria-label="В корзину: ${esc(p.name)}">${icon("i-bag")}<span>В корзину</span></button></div></div></article>`;
}
function collection(kind) {
  const groups = Object.entries(data.collections[kind]);
  const id = kind === "new" ? "new-arrivals" : "bestsellers";
  const panels = groups
    .map(([group, skus], i) => {
      if (skus.length < 3)
        throw new Error(`${kind}/${group} requires at least 3 products`);
      return `<div id="${id}-${group}" class="m-collection-panel" role="tabpanel" aria-labelledby="${id}-tab-${group}" tabindex="0" ${i ? "hidden" : ""}><div class="m-product-rail" data-product-rail style="--m-visible:${Math.min(4, skus.length)}">${skus.map((sku) => card(get(sku))).join("")}</div><div class="m-rail-footer"><a class="text-link" href="${groupLinks[group]}">${group === "all" ? "Все устройства" : "Весь раздел"} <span aria-hidden="true">→</span></a><div class="m-rail-controls"><button class="m-round-button" type="button" data-rail-prev aria-label="Предыдущие товары">←</button><button class="m-round-button" type="button" data-rail-next aria-label="Следующие товары">→</button></div></div></div>`;
    })
    .join("");
  return `<section class="section m-collection shell" id="${id}" aria-labelledby="${id}-title"><div class="m-section-heading reveal"><div><p class="eyebrow">${esc(editorial.collections[kind].eyebrow)}</p><h2 id="${id}-title">${esc(editorial.collections[kind].title)}</h2></div>${kind === "hits" ? '<button class="text-link" data-open-comparison type="button">Сравнить Galaxy <span aria-hidden="true">→</span></button>' : ""}</div><div class="m-tablist" role="tablist" aria-label="${esc(editorial.collections[kind].title)} по категориям">${groups.map(([group], i) => `<button id="${id}-tab-${group}" type="button" role="tab" aria-selected="${i === 0}" aria-controls="${id}-${group}" tabindex="${i ? -1 : 0}">${groupNames[group]}</button>`).join("")}</div><div class="m-collection-panels reveal">${panels}</div><p class="sr-only" data-collection-status aria-live="polite"></p><noscript><p class="m-fallback">Все категории доступны <a href="catalog.html">в каталоге Samsung →</a>.</p></noscript></section>`;
}
const categories = data.categories;
if (categories.length < 8) throw new Error("Expected expanded categories");
const categoriesHtml = `<section class="section m-categories shell" id="categories" aria-labelledby="categories-title"><div class="section-heading reveal"><p class="eyebrow">Ваш мир. Ваш Samsung.</p><h2 id="categories-title">Откройте мир Samsung</h2><p>Технологии для каждого дня. Выберите свой раздел.</p></div><div class="m-category-grid reveal">${categories
  .map((c) => {
    const mapped =
      { headphones: "audio", fridges: "refrigerators" }[c.id] || c.id;
    const g = c.image;
    if (!g?.width || !fs.existsSync(path.join(root, g.file)))
      throw new Error("Missing category image " + c.id);
    return `<a class="m-category" href="catalog.html?category=${mapped}"><div class="m-category-media" data-fit-image data-bounds="${esc(json(normalizeBounds(g.bounds, g.width, g.height)))}">${image(g, c.title)}</div><span>${esc(c.title)} <small aria-hidden="true">↗</small></span></a>`;
  })
  .join("")}</div></section>`;
const dailyProducts = data.collections.daily.map(get);
const dailyHtml = `<section class="m-daily section" id="daily-picks" aria-labelledby="daily-title"><div class="shell"><div class="m-section-heading reveal"><div><p class="eyebrow">В центре внимания</p><h2 id="daily-title">Товар дня</h2></div><div class="m-daily-controls"><span class="m-daily-count" aria-hidden="true"><b data-daily-current>01</b> / ${String(dailyProducts.length).padStart(2, "0")}</span><button class="m-round-button" type="button" data-daily-prev aria-label="Предыдущий товар дня">←</button><button class="m-round-button" type="button" data-daily-next aria-label="Следующий товар дня">→</button></div></div><div class="m-daily-stage reveal" role="region" aria-roledescription="карусель" aria-label="Товары дня" tabindex="0">${dailyProducts.map((p, i) => `<article class="m-daily-slide ${i ? "" : "is-active"}" data-daily-slide aria-hidden="${i !== 0}" aria-label="${i + 1} из ${dailyProducts.length}" ${i ? "inert" : ""}><div class="m-daily-media">${visual(p.image, p.name + " · " + p.variant, "m-daily-visual", p.url)}</div><div class="m-daily-copy"><p class="m-daily-category">${esc(categoryNames[p.category] || "Samsung")}</p><h3><a href="${esc(p.url)}">${esc(p.name)}</a></h3><p class="m-daily-variant">${esc(p.variant)}</p>${condition(p)}${price(p, "m-daily-price")}<div class="m-daily-actions"><button class="button button-dark" type="button" data-home-add="${esc(p.sku)}">${icon("i-bag")}В корзину</button><a class="text-link" href="${esc(p.url)}">Подробнее <span aria-hidden="true">↗</span></a></div><div class="m-daily-pagination" role="group" aria-label="Выбрать товар дня">${dailyProducts.map((item, n) => `<button type="button" data-daily-go="${n}" class="${n === i ? "is-active" : ""}" aria-label="${esc(item.name)}. Товар ${n + 1} из ${dailyProducts.length}" aria-pressed="${n === i}"><span></span></button>`).join("")}</div></div></article>`).join("")}</div><p class="sr-only" data-daily-status aria-live="polite"></p><noscript><p class="m-fallback">Другие предложения <a href="catalog.html">смотрите в каталоге →</a>.</p></noscript></div></section>`;

const journalFeed = fs.existsSync(path.join(root, "data/journal-feed.json"))
  ? JSON.parse(read("data/journal-feed.json"))
  : { articles: data.blog.articles };
const pinned = editorial.journal.pinned || [];
const latest = [...(journalFeed.articles || [])]
  .filter((a) => !pinned.some((p) => p.url === a.url) && !a.hidden)
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  .slice(0, editorial.journal.latestCount)
  .map((a) => ({ ...a, ...editorial.journal.overrides[a.url] }));
if (latest.length < 2)
  throw new Error("At least two dated articles are needed");
const articles = [latest[0], ...pinned, ...latest.slice(1)];
const journalHtml = `<section class="section journal m-journal shell" id="journal" aria-labelledby="journal-title"><div class="section-title-row reveal"><div><p class="eyebrow">Вдохновение и полезные советы</p><h2 id="journal-title">Ближе к технологиям</h2></div><a class="text-link" href="https://online-samsung.ru/station" target="_blank" rel="noopener">Все статьи <span aria-hidden="true">↗</span></a></div><div class="article-grid">${articles
  .map((a, i) => {
    const g = a.image;
    if (!g?.file || !fs.existsSync(path.join(root, g.file)))
      throw new Error("Missing article cover " + a.url);
    const date = a.date
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(a.date))
      : "";
    return `<a class="article-card ${i ? "" : "article-main"} reveal" href="${esc(a.url)}" target="_blank" rel="noopener"><div class="article-image">${image(g, g.alt || a.title)}</div><div class="article-copy"><div class="m-article-meta"><span class="article-meta">${esc(a.category || "Журнал Samsung")}</span>${date ? `<time datetime="${esc(a.date)}">${date}</time>` : ""}</div><h3>${esc(a.title)}</h3><span class="text-link">Читать <span aria-hidden="true">↗</span></span></div></a>`;
  })
  .join("")}</div></section>`;

function sectionRange(html, id) {
  const re = new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>`, "g");
  const m = re.exec(html);
  if (!m) return null;
  const token = /<\/?section\b[^>]*>/g;
  token.lastIndex = m.index;
  let depth = 0,
    t;
  while ((t = token.exec(html))) {
    depth += t[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return { start: m.index, end: token.lastIndex };
  }
  throw new Error("Unclosed section " + id);
}
function replaceSection(html, id, content) {
  const r = sectionRange(html, id);
  if (!r) throw new Error("Missing section " + id);
  return html.slice(0, r.start) + content + html.slice(r.end);
}
function removeSection(html, id) {
  const r = sectionRange(html, id);
  return r ? html.slice(0, r.start) + html.slice(r.end) : html;
}
function insertBefore(html, id, content) {
  const r = sectionRange(html, id);
  if (!r) throw new Error("Missing insert anchor " + id);
  return (
    html.slice(0, r.start).trimEnd() +
    "\n\n" +
    content +
    "\n\n" +
    html.slice(r.start).trimStart()
  );
}
let home = read("index.html");
home = replaceSection(home, "categories", categoriesHtml);
home = replaceSection(
  home,
  sectionRange(home, "new-arrivals") ? "new-arrivals" : "popular",
  collection("new"),
);
home = removeSection(home, "daily-picks");
home = insertBefore(home, "ecosystem", dailyHtml);
home = removeSection(home, "bestsellers");
home = insertBefore(home, "televisions", collection("hits"));
home = replaceSection(home, "journal", journalHtml);
home = home.replace("<body>", '<body class="home-merch-page">');
const version = editorial.version;
if (!home.includes("home-merch.css"))
  home = home.replace(
    "</head>",
    `<link rel="stylesheet" href="home-merch.css?v=${version}"/><noscript><style>.m-tablist,.m-rail-controls,.m-daily-controls,.m-daily-pagination,.m-favorite,.m-cart-button,.m-daily-actions>button{display:none!important}</style></noscript>\n</head>`,
  );
if (!home.includes("home-merch.js"))
  home = home.replace(
    "</body>",
    `<script src="home-merch.js?v=${version}" defer></script>\n</body>`,
  );
home = home.replace(
  /(home-merch\.css|home-merch\.js)\?v=[^"\s]+/g,
  `$1?v=${version}`,
);
home = home.replace(
  /<script type="application\/json" id="home-data">[\s\S]*?<\/script>\s*/,
  "",
);
home = home.replace(
  /<\/main>\s*/,
  `</main>\n<script type="application/json" id="home-data">${json({ products, capturedAt: data.capturedAt || data.researchedAt })}</script>\n`,
);
if (!home.includes('id="m-heart"'))
  home = home.replace(
    "</body>",
    `<svg class="svg-sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><symbol id="m-heart" viewBox="0 0 24 24"><path d="M20.5 4.5a5.3 5.3 0 0 0-7.5 0L12 5.6l-1.1-1.1a5.3 5.3 0 0 0-7.5 7.5L12 21l8.5-9a5.3 5.3 0 0 0 0-7.5Z"/></symbol></svg>\n</body>`,
  );
write("index.html", home);

// The broader home categories lead to a matching local catalog. Exact new SKUs
// without a bespoke demo detail page open their verified retailer product page.
const previousCatalog = JSON.parse(read("data/catalog.json"));
const added = Object.values(products)
  .filter((p) => !previousCatalog.some((x) => x.sku === p.sku))
  .map((p) => ({
    slug: p.sku.toLowerCase(),
    name: p.title,
    shortName: p.name,
    variant: p.variant,
    price: p.price,
    sku: p.sku,
    image: p.image.file,
    url: p.url,
    sourceUrl: p.sourceUrl,
    group: p.category,
    conditionNote: p.conditionNote || null,
  }));
const catalog = [...previousCatalog, ...added];
function catalogCard(p) {
  const imgData = Object.values(products).find((x) => x.sku === p.sku)?.image ||
    oldProducts[p.slug]?.gallery[0] || {
      file: p.image,
      width: 1200,
      height: 800,
    };
  const parent = ["refrigerators", "vacuums"].includes(p.group) ? "home" : "";
  return `<article class="p-related-card" data-product-card data-group="${esc(p.group)}" ${parent ? `data-parent-group="${parent}"` : ""} data-name="${esc(p.name.toLowerCase())}"><a href="${esc(p.url)}" class="p-related-image" aria-label="${esc(p.shortName)}">${image(imgData, p.shortName)}</a><div><a class="p-related-name" href="${esc(p.url)}">${esc(p.shortName)}</a><p class="p-card-variant">${esc(p.variant)}</p>${p.conditionNote ? '<p class="p-card-variant">Витринный образец</p>' : ""}<strong class="p-related-price">${money(p.price)}</strong><a class="button button-dark button-small" href="${esc(p.url)}">Выбрать <span aria-hidden="true">↗</span></a></div></article>`;
}
let catalogHtml = read("catalog.html");
const gridStart = catalogHtml.indexOf('<div class="p-catalog-grid">');
const emptyStart = catalogHtml.indexOf('<div class="p-catalog-empty"');
if (gridStart < 0 || emptyStart < 0)
  throw new Error("Catalog structure changed");
catalogHtml =
  catalogHtml.slice(0, gridStart) +
  `<div class="p-catalog-grid">${catalog.map(catalogCard).join("")}</div>` +
  catalogHtml.slice(emptyStart);
catalogHtml = catalogHtml.replace(
  /<p data-catalog-count>[^<]*<\/p>/,
  `<p data-catalog-count>${catalog.length} устройств</p>`,
);
const catalogDataMatch =
  /<script type="application\/json" id="catalog-data">([\s\S]*?)<\/script>/.exec(
    catalogHtml,
  );
const catalogData = JSON.parse(catalogDataMatch[1]);
Object.assign(catalogData.groups, {
  refrigerators: {
    name: "Холодильники",
    intro: "Больше пространства для свежих идей.",
  },
  vacuums: { name: "Пылесосы", intro: "Продуманная забота о вашем доме." },
  mobile: {
    name: "Мобильные устройства",
    intro: "Выберите свой формат Galaxy.",
  },
  extras: {
    name: "Аксессуары и носимые устройства",
    intro: "Детали, которые дополняют Samsung.",
  },
});
catalogHtml = catalogHtml.replace(
  catalogDataMatch[0],
  `<script type="application/json" id="catalog-data">${json(catalogData)}</script>`,
);
const filtersEnd = catalogHtml.indexOf('<div class="p-catalog-toolbar">');
if (filtersEnd < 0) throw new Error("Missing catalog filters");
const filterClose = catalogHtml.lastIndexOf("</div>", filtersEnd);
const buttons = ["mobile", "extras", "refrigerators", "vacuums"]
  .filter((k) => !catalogHtml.includes(`data-category="${k}"`))
  .map(
    (k) =>
      `<button class="p-filter" type="button" data-category="${k}" aria-pressed="false">${catalogData.groups[k].name}</button>`,
  )
  .join("");
catalogHtml =
  catalogHtml.slice(0, filterClose) + buttons + catalogHtml.slice(filterClose);
write("catalog.html", catalogHtml);
write("data/catalog.json", JSON.stringify(catalog, null, 2));
console.log(
  `Built home: ${categories.length} categories, ${Object.keys(products).length} verified products, 9 collection tabs, ${dailyProducts.length} daily picks, ${articles.length} articles. Catalog: ${catalog.length} SKUs.`,
);
