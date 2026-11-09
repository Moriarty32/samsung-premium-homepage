import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Static output: product descriptions and the first photo remain available without JavaScript.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) =>
  fs.readFileSync(path.join(root, p), "utf8").replace(/^\uFEFF/, "");
const write = (p, s) =>
  fs.writeFileSync(path.join(root, p), s.trimEnd() + "\n");
const sources = JSON.parse(read("data/product-sources.json"));
const imageLayout = JSON.parse(read("data/image-layout.json"));
for (const source of Object.values(sources)) {
  for (const gallery of [
    source.gallery,
    ...(source.variants || []).map((v) => v.gallery),
  ])
    for (const g of gallery || []) g.bounds = imageLayout[g.file]?.bounds;
}
const version = "20261109-merch-2";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
const json = (d) => JSON.stringify(d).replace(/</g, "\\u003c");
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const link = (url, text, cls = "text-link") =>
  `<a class="${cls}" href="${esc(url)}">${text}</a>`;
const out = (url, text, cls = "text-link") =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${text}</a>`;
const button = (text, attr = "", cls = "button button-dark") =>
  `<button type="button" class="${cls}" ${attr}>${text}</button>`;
const img = (g, cls = "", eager = false) =>
  `<img class="${cls}" src="${esc(g.file)}" width="${g.width}" height="${g.height}" alt="${esc(g.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"/>`;
const groups = {
  smartphones: { name: "Смартфоны", intro: "Выберите свой формат Galaxy." },
  tv: { name: "Телевизоры", intro: "Большой экран. Больше впечатлений." },
  home: { name: "Техника для дома", intro: "Продумана до последней детали." },
  tablets: { name: "Планшеты", intro: "Пространство для ваших идей." },
  watches: { name: "Часы", intro: "Ваш ритм. Ваш Galaxy." },
  audio: { name: "Наушники", intro: "Ближе к любимому звуку." },
  accessories: {
    name: "Аксессуары",
    intro: "Детали, которые дополняют Galaxy.",
  },
  wearables: { name: "Часы и наушники", intro: "Продолжение вашего Galaxy." },
};
const editorial = {
  "galaxy-s26-ultra": {
    group: "smartphones",
    name: "Samsung Galaxy S26 Ultra",
    family: "Galaxy",
    story: ["Ваша история.", "В каждой детали."],
    storyText: "Основная камера 200 МП — для важных моментов и деталей.",
    scene: "assets/product-scenes/camera.webp",
    featureTitle: "Создан для большего.",
    features: [
      [
        "Больше пространства\nдля идей.",
        "Большой и яркий дисплей для работы, творчества и развлечений.",
        "6,9″ · 120 Гц",
        1,
      ],
      [
        "От мысли —\nк первому штриху.",
        "Делайте заметки, рисуйте и фиксируйте идеи с помощью S Pen.",
        "Встроенный S Pen",
        "assets/product-scenes/pen.webp",
      ],
    ],
    selected: [
      "Технология экрана",
      "Диагональ, дюйм",
      "Тип процессора",
      "Оперативная память (RAM), Гб",
      "Встроенная память (ROM), Гб",
      "Основная камера, МПикс",
      "Емкость аккумулятора, мАч",
      "Глубина устройства, мм",
      "Вес (устройства), грамм",
    ],
    related: ["galaxy-buds4-pro", "galaxy-watch-ultra", "galaxy-case"],
    detail: 2,
  },
  "galaxy-s26": {
    group: "smartphones",
    name: "Samsung Galaxy S26",
    family: "Galaxy",
    story: ["Каждый день.", "С вашим характером."],
    storyText:
      "Камера 50 МП и экран Dynamic AMOLED 2X в привычном формате Galaxy.",
    featureTitle: "Всё, что вы любите в Galaxy.",
    features: [
      [
        "Ярче. Плавнее.\nВыразительнее.",
        "Дисплей Dynamic AMOLED 2X с частотой обновления 120 Гц.",
        "6,3″ · 120 Гц",
        1,
      ],
      [
        "Моменты,\nкоторые остаются.",
        "Сохраняйте любимые истории с основной камерой 50 МП.",
        "Оптическая стабилизация",
        2,
      ],
    ],
    selected: [
      "Технология экрана",
      "Диагональ, дюйм",
      "Тип процессора",
      "Оперативная память (RAM), Гб",
      "Встроенная память (ROM), Гб",
      "Основная камера, МПикс",
      "Емкость аккумулятора, мАч",
      "Вес (устройства), грамм",
    ],
    related: ["galaxy-buds4-pro", "galaxy-watch-ultra", "galaxy-s26-ultra"],
    detail: 2,
  },
  "galaxy-z-fold7": {
    group: "smartphones",
    name: "Samsung Galaxy Z Fold7",
    family: "Galaxy",
    story: ["Раскройте больше.", "В одном движении."],
    storyText:
      "Большой внутренний экран 8″ — новое пространство для работы и впечатлений.",
    featureTitle: "Ваш день в большом формате.",
    features: [
      [
        "Больше экрана.\nБольше идей.",
        "Внутренний экран Dynamic AMOLED 2X для ваших повседневных задач.",
        "8″ · 120 Гц",
        1,
      ],
      [
        "Два экрана.\nОдин Galaxy.",
        "Внешний дисплей 6,5″ — когда удобнее привычный формат.",
        "Внешний и внутренний экран",
        2,
      ],
    ],
    selected: [
      "Диагональ, дюйм",
      "Дополнительный Экран (Диагональ), дюйм",
      "Тип процессора",
      "Оперативная память (RAM), Гб",
      "Встроенная память (ROM), Гб",
      "Основная камера, МПикс",
      "Емкость аккумулятора, мАч",
      "Вес (устройства), грамм",
    ],
    related: ["galaxy-buds4-pro", "galaxy-watch-ultra", "galaxy-tab-ultra"],
    detail: 2,
  },
  "galaxy-watch-ultra": {
    group: "watches",
    name: "Samsung Galaxy Watch Ultra",
    family: "Galaxy",
    story: ["Ваш ритм.", "Ваши возможности."],
    storyText: "Титановый корпус, Super AMOLED и всё важное на запястье.",
    scene: "assets/product-scenes/watch.webp",
    featureTitle: "Каждая деталь в вашем ритме.",
    features: [
      [
        "Характер\nв деталях.",
        "Титановый корпус и ремешок из фторэластомера.",
        "Титан · IP68",
        1,
      ],
      [
        "Всё важное —\nперед глазами.",
        "Яркий Super AMOLED для уведомлений, времени и ваших показателей.",
        "1,47″ · 480 × 480",
        2,
      ],
    ],
    selected: [
      "Тип экрана",
      "Диагональ, дюйм",
      "Разрешение экрана, Пикс.",
      "Операционная система",
      "Материал корпуса",
      "Класс водонепроницаемости",
      "Емкость аккумулятора, мАч",
      "Вес (устройства), г (грамм)",
    ],
    related: ["galaxy-buds4-pro", "galaxy-s26-ultra", "galaxy-tab-ultra"],
    detail: 2,
  },
  "galaxy-buds4-pro": {
    group: "audio",
    name: "Samsung Galaxy Buds4 Pro",
    family: "Galaxy",
    story: ["Только вы.", "И любимый звук."],
    storyText:
      "Активное шумоподавление и управление прикосновением в компактном формате.",
    scene: "assets/product-scenes/buds.webp",
    featureTitle: "Продуманы до каждой ноты.",
    features: [
      [
        "Меньше шума.\nБольше музыки.",
        "Активное подавление шума помогает сосредоточиться на любимом.",
        "Активное шумоподавление",
        1,
      ],
      [
        "Звук всегда\nс вами.",
        "Компактный зарядный футляр с поддержкой беспроводной зарядки.",
        "Беспроводная зарядка",
        2,
      ],
    ],
    selected: [
      "Тип",
      "Тип подключения наушников",
      "Версия Bluetooth",
      "Система активного подавления шума",
      "Класс водонепроницаемости",
      "Время работы без подзарядки в футляре, час",
      "Время работы с подзарядкой в футляре, час",
      "Вес наушника, г",
    ],
    related: ["galaxy-s26-ultra", "galaxy-watch-ultra", "galaxy-tab-ultra"],
    detail: 2,
  },
  "samsung-tv-75": {
    group: "tv",
    name: "Samsung Mini LED 75″",
    family: "Samsung",
    story: ["Изображение,", "которое впечатляет."],
    storyText: "Мини LED и разрешение 4K — новый масштаб любимых историй.",
    scene: "assets/campaign-cinema.webp",
    featureTitle: "Ваше пространство для впечатлений.",
    features: [
      [
        "Истории\nв большом масштабе.",
        "Экран 75″ с разрешением 3840 × 2160 пикселей.",
        "75″ · 4K Ultra HD",
        0,
      ],
      [
        "Больше,\nчем телевизор.",
        "Tizen и SmartThings для развлечений и подключённых устройств.",
        "Smart TV · Tizen",
        1,
      ],
    ],
    selected: [
      "Диагональ, дюймов",
      "Стандарт разрешения экрана",
      "Разрешение экрана, Пикс.",
      "Частота обновления, Гц",
      "Процессор",
      "Операционная система",
      "HDMI",
      "Мощность акустической системы, Вт",
    ],
    related: ["galaxy-tab-ultra", "galaxy-buds4-pro", "galaxy-s26-ultra"],
    detail: 1,
  },
  "samsung-washer": {
    group: "home",
    name: "Samsung Bespoke AI",
    family: "Samsung",
    story: ["Забота о вещах.", "В каждой детали."],
    storyText:
      "Стирка и сушка в одном устройстве. Продуманный уход в вашем доме.",
    scene: "assets/product-scenes/home.webp",
    featureTitle: "Продумано для вашего дома.",
    features: [
      [
        "Больше места\nдля заботы.",
        "До 18 кг для стирки и до 11 кг для сушки.",
        "18 кг · стирка / 11 кг · сушка",
        0,
      ],
      [
        "Уход, который\nстановится проще.",
        "Управление со смартфона и автоматическая подача моющих средств.",
        "Управление со смартфона",
        2,
      ],
    ],
    selected: [
      "Тип стиральной машины",
      "Тип сушки",
      "Максимальная загрузка (стирка), кг",
      "Вместимость для сушки, кг",
      "Мотор",
      "Макс. скорость отжима, об/мин",
      "Автоматическая подача моющих средств",
      "Управление со смартфона",
    ],
    related: ["samsung-dryer", "samsung-tv-75", "galaxy-tab-ultra"],
    detail: 1,
  },
  "samsung-dryer": {
    group: "home",
    name: "Samsung Hybrid HeatPump",
    family: "Samsung",
    story: ["Бережный уход.", "Продуманный результат."],
    storyText:
      "Гибридный тепловой насос и вместительный барабан для повседневной заботы.",
    scene: "assets/product-scenes/home.webp",
    featureTitle: "Комфорт в каждой детали.",
    features: [
      [
        "Пространство\nдля ваших вещей.",
        "Загрузка до 16 кг для сушки белья.",
        "16 кг · загрузка",
        0,
      ],
      [
        "Технологии\nбережного ухода.",
        "Гибридный тепловой насос и класс энергоэффективности A+++.",
        "Hybrid HeatPump · A+++",
        2,
      ],
    ],
    selected: [
      "Тип стиральной машины",
      "Тип сушки",
      "Вместимость для сушки, кг",
      "Класс энергоэффективности",
      "Уровень шума (сушка), дБ",
      "Управление со смартфона",
      "Защита от детей",
      "Вес (устройства), кг",
    ],
    related: ["samsung-washer", "samsung-tv-75", "galaxy-tab-ultra"],
    detail: 1,
  },
  "galaxy-tab-ultra": {
    group: "tablets",
    name: "Samsung Galaxy Tab S12 Ultra",
    family: "Galaxy",
    story: ["Большие идеи.", "Ваше пространство."],
    storyText:
      "Дисплей Dynamic AMOLED 2X 14,6″ и стилус для работы и творчества.",
    featureTitle: "Создан для ваших идей.",
    features: [
      [
        "Больше экрана\nдля большего.",
        "Пространство 14,6″ для проектов, заметок и любимых историй.",
        "14,6″ · Dynamic AMOLED 2X",
        0,
      ],
      [
        "От мысли —\nк первому штриху.",
        "Стилус в комплекте — для заметок и творческих задач.",
        "Поддержка стилуса",
        "assets/product-scenes/pen.webp",
      ],
    ],
    selected: [
      "Диагональ, Дюймы",
      "Технология экрана",
      "Тип процессора",
      "Оперативная память (RAM), Гб",
      "Встроенная память (ROM), Гб",
      "Емкость аккумулятора, мАч",
      "Порт USB",
      "Вес (устройства), гр",
    ],
    related: ["galaxy-buds4-pro", "galaxy-watch-ultra", "galaxy-s26-ultra"],
    detail: 2,
  },
  "galaxy-case": {
    group: "accessories",
    name: "Samsung Carbon Magnet Case",
    family: "Samsung",
    story: ["Защита.", "С характером Galaxy."],
    storyText:
      "Тонкая деталь, которая завершает образ вашего Galaxy S26 Ultra.",
    featureTitle: "Детали решают всё.",
    features: [
      [
        "Создан\nдля вашего Galaxy.",
        "Точная совместимость с Samsung Galaxy S26 Ultra.",
        "Для Galaxy S26 Ultra",
        1,
      ],
      [
        "Выразительная\nфактура.",
        "Арамид, поликарбонат, алюминий и магниты в одном аксессуаре.",
        "Вес 22 г",
        2,
      ],
    ],
    selected: [
      "Тип",
      "Назначение",
      "Совместимость",
      "материал",
      "цвет",
      "Вес чехла, г",
      "Высота, мм",
      "Ширина, мм",
    ],
    related: ["galaxy-s26-ultra", "galaxy-buds4-pro", "galaxy-watch-ultra"],
    detail: 1,
  },
};

function relabel(s) {
  const map = {
    "Тип процессора": "Процессор",
    "Технология экрана": "Экран",
    "Оперативная память (RAM), Гб": "Оперативная память, ГБ",
    "Встроенная память (ROM), Гб": "Память, ГБ",
    "Основная камера, МПикс": "Основная камера, МП",
    "Емкость аккумулятора, мАч": "Аккумулятор, мА·ч",
    "Глубина устройства, мм": "Толщина, мм",
    "Вес (устройства), грамм": "Вес, г",
    "Диагональ, дюйм": "Диагональ, дюймы",
    "Вес (устройства), гр": "Вес, г",
    "Материал корпуса": "Материал корпуса",
  };
  return map[s] || s;
}
const products = Object.entries(sources)
  .filter(([slug]) => editorial[slug])
  .map(([slug, s]) => {
    const e = editorial[slug];
    const seen = new Set();
    const allSpecs = (s.allSpecs || s.specs).filter((x) => {
      if (seen.has(x.label)) return false;
      seen.add(x.label);
      return true;
    });
    const selected = e.selected
      .map((label) => allSpecs.find((x) => x.label === label))
      .filter(Boolean)
      .map((x) => ({ ...x, label: relabel(x.label) }));
    return {
      ...s,
      ...e,
      variant: s.variant
        .replace(/Гб/g, "ГБ")
        .replace("Темная-сталь", "Тёмная сталь")
        .replace("синий-титан", "Синий титан")
        .replace("Черный-титан", "Чёрный титан"),
      specs: allSpecs,
      slug,
      selected,
    };
  });
const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

let home = read("index.html");
const routeMap = new Map([
  [
    "https://online-samsung.ru/catalog/smartfony/samsung-galaxy-s26-ultra",
    "galaxy-s26-ultra.html",
  ],
  [
    "https://online-samsung.ru/catalog/smartfony/samsung-galaxy-s26",
    "galaxy-s26.html",
  ],
  [
    "https://online-samsung.ru/catalog/smartfony/samsung-galaxy-z-fold-7",
    "galaxy-z-fold7.html",
  ],
  ...products.map((p) => [p.sourceUrl, p.slug + ".html"]),
  [
    "https://online-samsung.ru/catalog/smartfony",
    "catalog.html?category=smartphones",
  ],
  [
    "https://online-samsung.ru/catalog/tv-i-audio/in-stock",
    "catalog.html?category=tv",
  ],
  [
    "https://online-samsung.ru/catalog/televizory/in-stock",
    "catalog.html?category=tv",
  ],
  [
    "https://online-samsung.ru/catalog/bytovaya-tehnika/in-stock",
    "catalog.html?category=home",
  ],
  [
    "https://online-samsung.ru/catalog/planshety/in-stock",
    "catalog.html?category=tablets",
  ],
  [
    "https://online-samsung.ru/catalog/smart-chasy",
    "catalog.html?category=watches",
  ],
  [
    "https://online-samsung.ru/catalog/naushniki",
    "catalog.html?category=audio",
  ],
  [
    "https://online-samsung.ru/catalog/nosimye-ustroystva",
    "catalog.html?category=wearables",
  ],
  [
    "https://online-samsung.ru/catalog/aksessuary/dlya_ustroystv",
    "catalog.html?category=accessories",
  ],
]);
home = home.replace(/<a\b[^>]*>/gs, (tag) => {
  const found = /href="([^"]+)"/.exec(tag);
  if (!found) return tag;
  const dest = routeMap.get(found[1]);
  if (dest)
    return tag
      .replace(found[0], `href="${dest}"`)
      .replace(/\s+target="[^"]*"/g, "")
      .replace(/\s+rel="[^"]*"/g, "");
  if (
    found[1] === "https://online-samsung.ru/cart" &&
    !tag.includes("data-cart-open")
  )
    return tag
      .replace(
        found[0],
        'href="https://online-samsung.ru/cart" data-cart-open aria-controls="cart-dialog"',
      )
      .replace(/\s+target="[^"]*"/g, "")
      .replace(/\s+rel="[^"]*"/g, "");
  return tag;
});
home = home
  .replace(
    /action="https:\/\/online-samsung.ru\/search"\s+method="get"\s+target="_blank"/,
    'action="catalog.html" method="get"',
  )
  .replace(/name="query"/, 'name="q"');
home = home.replace(/(design\.css|script\.js)\?v=[^"\s]+/g, `$1?v=${version}`);
if (!home.includes("commerce.css"))
  home = home.replace(
    "</head>",
    `<link rel="stylesheet" href="commerce.css?v=${version}"/>\n</head>`,
  );
if (!home.includes("commerce.js"))
  home = home.replace(
    "</body>",
    `<script src="commerce.js?v=${version}" defer></script>\n</body>`,
  );
home = home.replace(
  /(commerce\.css|commerce\.js)\?v=[^"\s]+/g,
  `$1?v=${version}`,
);
write("index.html", home);
const header = home
  .match(/<header\b[\s\S]*?<\/header>/)[0]
  .replace(/href="#top"/g, 'href="index.html"')
  .replace(/href="#faq"/g, 'href="#questions"');
const footer = home
  .match(/<footer\b[\s\S]*?<\/footer>/)[0]
  .replace(/href="#faq"/g, 'href="#questions"')
  .replace(
    /href="#top" aria-label="Online Samsung — наверх"/,
    'href="index.html" aria-label="Online Samsung — на главную"',
  );
const commonDialogs = home.match(
  /<dialog\s+class="comparison-dialog"[\s\S]*?<\/dialog>/,
)[0];
const sprite = home.match(/<svg\s+class="svg-sprite"[\s\S]*?<\/svg>/)[0];
const extraSprite = `<svg class="svg-sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<symbol id="i-heart" viewBox="0 0 24 24"><path d="M20.5 4.5a5.3 5.3 0 0 0-7.5 0L12 5.6l-1.1-1.1a5.3 5.3 0 0 0-7.5 7.5L12 21l8.5-9a5.3 5.3 0 0 0 0-7.5Z"/></symbol>
<symbol id="i-compare" viewBox="0 0 24 24"><path d="M4 21V10h4v11M10 21V3h4v18M16 21V7h4v14M2 21h20"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-box" viewBox="0 0 24 24"><path d="m3 7 9-5 9 5v10l-9 5-9-5Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24"><path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h8"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 11a9 9 0 0 1-9 9H3l1-5A9 9 0 1 1 21 11Z"/><path d="M7 11h.01M12 11h.01M17 11h.01" stroke-width="3" stroke-linecap="round"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M4 3h4l2 5-3 2a17 17 0 0 0 7 7l2-3 5 2v4c0 2-4 2-7 0A25 25 0 0 1 4 10C2 7 2 3 4 3Z"/></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><path d="M3 10a9 9 0 0 1 16-5l2 3M21 3v5h-5M21 14A9 9 0 0 1 5 19l-2-3M3 21v-5h5"/></symbol>
</svg>`;
function base(title, body, { catalog = false, p } = {}) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#ffffff"/><title>${esc(title)} — Online Samsung</title><meta name="description" content="${esc(p ? p.name + " — фотографии, выбор версии, характеристики и аксессуары." : "Техника Samsung. Выберите устройство в вашем формате.")}"/><link rel="icon" href="assets/client-logo.svg" type="image/svg+xml"/><link rel="preload" href="assets/SamsungOne-400.woff2" as="font" type="font/woff2" crossorigin/><link rel="preload" href="assets/samsung-sharp-bold.woff" as="font" type="font/woff" crossorigin/><link rel="stylesheet" href="design.css?v=${version}"/><link rel="stylesheet" href="commerce.css?v=${version}"/><link rel="stylesheet" href="product.css?v=${version}"/>${p ? `<link rel="preload" as="image" href="${p.gallery[0].file}"/>` : ""}<noscript><style>.p-main-image{transform:none!important}.p-buy-buttons,.p-tools,.p-availability,.p-review-actions{display:none!important}</style></noscript></head><body ${p ? `data-product="${p.slug}"` : ""} class="${catalog ? "catalog-page" : "product-page"}"><a class="skip-link" href="#main">Перейти к содержимому</a><div class="p-topbar"><div class="shell">${link("tel:88007557525", icon("phone") + "8 800 755-7525", "p-top-phone")}<div>${out("https://online-samsung.ru/delivery", "Доставка")}${out("https://online-samsung.ru/payment", "Оплата")}${link("#questions", "Поддержка")}</div></div></div>${header}${body}${footer}${commonDialogs}${sprite}${extraSprite}<script src="script.js?v=${version}" defer></script><script src="commerce.js?v=${version}" defer></script><script src="product.js?v=${version}" defer></script></body></html>`;
}
function shortSpecRows(rows, cls = "") {
  return `<dl class="p-spec-list ${cls}">${rows.map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join("")}</dl>`;
}
const swatchColors = {
  фиолетовый: "#9b84b8",
  чёрный: "#424348",
  черный: "#424348",
  серый: "#c1c2c5",
  голубой: "#adcbd8",
  белый: "#eeece7",
  синий: "#253b54",
  серебристый: "#b9bbbd",
};
function variants(p) {
  const vs = p.variants || [];
  const color =
    p.specs.find((s) => /^(Цвет палитра|цвет|Цвет|Цвет корпуса)$/.test(s.label))
      ?.value || p.variant;
  return `<div class="p-selection"><p>Цвет: <strong data-color-label>${esc(color)}</strong></p><div class="p-swatches" data-colors>${button("", `aria-label="${esc(color)}" aria-pressed="true" style="--swatch:${swatchColors[color.toLowerCase()] || "#8a8c90"}"`, "p-swatch is-selected")}</div><p class="p-variant-note" data-variant-note>${esc(p.variant)}</p></div>${vs.length ? '<div class="p-selection"><p id="memory-label">Память</p><div class="p-memory" data-memory role="group" aria-labelledby="memory-label"></div></div>' : ""}<noscript><p class="p-note">Другие цвета и объём памяти ${out(p.sourceUrl, "выберите в магазине ↗")}.</p></noscript>`;
}
function card(p) {
  return `<article class="p-related-card" data-product-card data-group="${p.group}" data-name="${esc(p.name.toLowerCase())}"><a href="${p.slug}.html" class="p-related-image" aria-label="${esc(p.name)}">${img(p.gallery[0])}</a><div><a class="p-related-name" href="${p.slug}.html">${esc(p.shortName)}</a><p class="p-card-variant">${esc(p.variant)}</p><strong class="p-related-price">${money(p.price)}</strong>${link(p.slug + ".html", 'Выбрать <span aria-hidden="true">↗</span>', "button button-dark button-small")}</div></article>`;
}
function faqs(p) {
  const warranty = p.specs.find((s) => s.label === "Гарантия, месяц")?.value;
  const qs = [
    [
      "Какая гарантия у выбранной версии?",
      `В карточке ${esc(p.sku)} указана гарантия ${esc(warranty || "по условиям магазина")} ${warranty === "1" ? "месяц" : "месяцев"}. Условия обслуживания и документы уточните перед покупкой. ${out("https://online-samsung.ru/service", "Гарантия и сервис ↗")}`,
    ],
    [
      p.group === "accessories"
        ? "С каким устройством совместим аксессуар?"
        : p.group === "home"
          ? "Как проверить размеры перед покупкой?"
          : p.group === "tv"
            ? "Как подобрать место для телевизора?"
            : "Как выбрать подходящую версию?",
      p.group === "accessories"
        ? "Эта модель предназначена для Galaxy S26 Ultra. Совместимость с другими устройствами не заявлена."
        : p.group === "home"
          ? "Проверьте габариты в характеристиках, ширину проходов и свободное место для подключения. Требования к установке уточните в руководстве выбранной модели."
          : p.group === "tv"
            ? "Сопоставьте диагональ, расстояние до экрана и размер места установки. Перед настенным монтажом проверьте совместимость кронштейна и требования руководства."
            : "Сравните выбранный цвет, память и артикул. Фотографии относятся к указанной конфигурации. Доступность каждой версии подтвердит консультант магазина.",
    ],
    [
      p.group === "smartphones"
        ? "Как перенести данные на Galaxy?"
        : "Что входит в комплект?",
      p.group === "smartphones"
        ? `Перед переносом создайте резервную копию. Доступность способов переноса зависит от прежнего устройства. ${out("https://www.samsung.com/ru/apps/smart-switch/", "О Samsung Smart Switch ↗")}`
        : "Проверенный состав комплекта указан в разделе «Комплектация». Актуальную упаковку и наличие дополнительных принадлежностей подтвердит магазин.",
    ],
    [
      "Как оплатить заказ?",
      `Способы оплаты и условия рассрочки зависят от выбранного товара и оформления заказа. ${out("https://online-samsung.ru/payment", "Способы оплаты ↗")}`,
    ],
    [
      "Как оформить доставку?",
      `Доставку и самовывоз можно согласовать при оформлении в магазине. Срок и стоимость зависят от адреса и выбранной техники. ${out("https://online-samsung.ru/delivery", "Доставка и самовывоз ↗")}`,
    ],
  ];
  if (p.group === "smartphones") {
    qs[1] = [
      "Какие SIM-карты поддерживает устройство?",
      "В карточке этой модели указаны nano-SIM и eSIM. Доступные сочетания SIM-карт и условия активации eSIM уточните у оператора перед покупкой.",
    ];
    qs[3] = [
      "Как работает Trade-in?",
      `Условия обмена, перечень подходящих устройств и оценку подтвердит магазин. ${out("https://online-samsung.ru/trade-in", "Подробнее о Trade-in ↗")}`,
    ];
  }
  return qs
    .map(
      ([q, a]) =>
        `<details><summary>${q}<span class="p-faq-plus" aria-hidden="true">+</span></summary><div class="p-faq-answer"><p>${a}</p></div></details>`,
    )
    .join("");
}
function productPage(p) {
  const gallery = p.gallery;
  if (!gallery?.length) throw new Error(`Missing gallery ${p.slug}`);
  const color =
    p.specs.find((s) => /^(Цвет палитра|цвет|Цвет|Цвет корпуса)$/.test(s.label))
      ?.value || p.variant;
  const stats = p.stats?.length
    ? p.stats.slice(0, 3)
    : p.selected.slice(0, 3).map((x) => ({ value: x.value, label: x.label }));
  if (p.slug === "galaxy-s26-ultra")
    stats[2] = { value: "S Pen", label: "Встроенное электронное перо" };
  const compact = p.selected.slice(2, 5);
  const scene = p.scene
    ? `<img class="p-story-scene" src="${p.scene}" alt="${esc(p.shortName)} — рекламная композиция" width="2172" height="724" loading="lazy"/>`
    : `<div class="p-story-product">${img(gallery[0])}</div>`;
  const featureHtml = p.features
    .map(([title, copy, caption, image]) => {
      const source =
        typeof image === "number"
          ? gallery[image % gallery.length]
          : {
              file: image,
              width: 1536,
              height: 1024,
              alt: "Стилус S Pen — рекламная иллюстрация",
            };
      return `<article class="p-feature reveal ${typeof image === "string" ? "p-feature-scene" : ""}"><div class="p-feature-copy"><h3>${title.split("\n").map(esc).join("<br/>")}</h3><p>${esc(copy)}</p><span>${esc(caption)}</span></div>${typeof image === "number" ? `<div class="p-feature-visual" data-image-bounds="${esc(JSON.stringify(source.bounds))}">${img(source, "p-feature-image")}</div>` : img(source, "p-feature-image")}</article>`;
    })
    .join("");
  const packageItems = (p.includedPackage || [])
    .map((x) =>
      typeof x === "string"
        ? x
        : x.label === "Количество стилусов"
          ? `Стилус (${x.value} шт.)`
          : x.label === "сменные амбушюры, шт"
            ? `Сменные амбушюры (${x.value} шт.)`
            : x.label || x.name || x.value,
    )
    .filter(Boolean);
  const serviceDelivery = ["home", "tv", "accessories"].includes(p.group);
  const serviceCard = serviceDelivery
    ? `<a href="https://online-samsung.ru/delivery" target="_blank" rel="noopener" class="p-service-card">${icon("truck")}<div><h3>Доставка и самовывоз</h3><p>Выберите удобный способ<br/>получения устройства.</p><span class="p-underlink">Условия доставки ↗</span></div>${img(gallery[0])}</a>`
    : `<a href="https://online-samsung.ru/trade-in" target="_blank" rel="noopener" class="p-service-card">${icon("refresh")}<div><h3>Обновление с Trade-in</h3><p>Узнайте условия обмена<br/>вашего устройства.</p><span class="p-underlink">Рассчитать оценку ↗</span></div><img src="assets/catalog-phone.webp" alt="" width="1200" height="800" loading="lazy"/></a>`;
  const body = `<main id="main">
 <div class="shell p-main-top"><nav class="p-breadcrumb" aria-label="Хлебные крошки">${link("index.html", "Главная")}<span>/</span>${link("catalog.html?category=" + p.group, groups[p.group].name)}<span>/</span><span aria-current="page">${esc(p.shortName)}</span></nav>
 <div class="p-title-row"><div><h1>${esc(p.name)}</h1><p class="p-subtitle" data-variant-label>${esc(p.variant.replace(",", " ·"))}</p></div><p class="p-sku">Артикул: <span data-sku>${esc(p.sku)}</span></p></div>
 <section class="p-purchase" id="purchase" aria-label="Выбор и покупка ${esc(p.shortName)}">
 <div class="p-gallery"><a class="p-gallery-main" href="${gallery[0].file}" data-gallery-open aria-label="Увеличить фотографию ${esc(p.shortName)}">${img(gallery[0], "p-main-image", true)}<span class="p-zoom">${icon("search")}</span></a><div class="p-thumbnails" role="group" aria-label="Фотографии товара">${gallery.map((g, i) => button(img({ ...g, alt: "Ракурс " + (i + 1) }), `data-photo="${i}" aria-label="Показать ракурс ${i + 1}" aria-pressed="${i === 0}"`, "p-thumb" + (i === 0 ? " is-active" : ""))).join("")}</div><p class="p-gallery-counter" aria-live="polite"><span data-photo-current>1</span> / ${gallery.length}</p></div>
 <div class="p-configuration"><div class="p-tools">${button(icon("heart") + "<span>В избранное</span>", `data-favorite aria-pressed="false"`, "p-tool")}${button(icon("compare") + "<span>Сравнить</span>", `data-product-compare`, "p-tool")}</div>${variants(p)}${shortSpecRows(compact, "p-quick-specs")}${link("#specifications", 'Все характеристики <span aria-hidden="true">→</span>', "p-underlink")}</div>
 <aside class="p-buy-panel"><p class="p-buy-eyebrow">Ваш ${p.family}</p><p class="p-price"><span data-price>${money(p.price)}</span><sup>*</sup></p><p class="p-price-note">Цена выбранной версии</p>${button("Уточнить наличие", `data-consult="availability"`, "p-underlink p-availability")}<div class="p-buy-buttons">${button(icon("bag") + "В корзину", "data-add-cart")}${button("Купить в один клик", 'data-consult="buy"', "button p-button-outline")}</div><noscript><p>${out(p.sourceUrl, "Открыть в магазине ↗", "button button-dark")}</p></noscript><div class="p-payment-links">${out("https://online-samsung.ru/payment", icon("card") + "<span>Рассрочка <small>Условия ↗</small></span>", "p-buy-link")}${out("https://online-samsung.ru/payment", icon("card") + "<span>Способы оплаты <small>Подробнее ↗</small></span>", "p-buy-link")}</div><p class="p-delivery-heading">Получение · Москва</p>${out("https://online-samsung.ru/delivery", icon("truck") + "<span>Курьером <small>Рассчитать доставку ↗</small></span>", "p-buy-link")}${out("https://online-samsung.ru/shop", icon("box") + "<span>Самовывоз <small>Выбрать магазин ↗</small></span>", "p-buy-link")}${out("https://online-samsung.ru/service", 'Гарантия и сервис <span aria-hidden="true">↗</span>', "p-underlink p-warranty")}</aside>
 </section></div>
 <nav class="p-section-nav" aria-label="О товаре"><div class="shell">${[
   ["overview", "Обзор"],
   ["specifications", "Характеристики"],
   ["package", "Комплектация"],
   ["accessories", "Аксессуары"],
   ["reviews", "Отзывы"],
   ["questions", "Вопросы"],
 ]
   .map(
     ([id, label]) =>
       `<a href="#${id}" ${id === "overview" ? 'class="is-active" aria-current="location"' : ""}>${label}</a>`,
   )
   .join("")}</div></nav>
 <section id="overview" class="p-overview"><div class="shell p-stat-row reveal">${stats.map((s) => `<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join("")}</div><div class="p-story ${p.scene ? "" : "p-story-contained"} ${p.group === "home" ? "p-story-home" : ""}">${scene}<div class="shell p-story-inner"><div class="p-story-copy reveal"><h2>${p.story.map(esc).join("<br/>")}</h2><p>${esc(p.storyText)}</p></div></div></div><div class="shell p-features-wrap"><h2 class="p-section-title reveal">${esc(p.featureTitle)}</h2><div class="p-features">${featureHtml}</div></div></section>
 <section class="shell p-details-section" id="specifications"><h2 class="p-section-title reveal">Всё важное — в деталях.</h2><div class="p-details-grid"><div class="p-details-image reveal">${img(gallery[p.detail % gallery.length])}</div><div class="reveal">${shortSpecRows(p.selected)}<details class="p-full-specs"><summary class="button p-button-outline">Все характеристики <span aria-hidden="true">+</span></summary>${shortSpecRows(p.specs.filter((x) => !/^Декларация|\(диапазон\)/.test(x.label)))}</details><p class="p-source-note">Характеристики версии <span data-spec-sku>${esc(p.sku)}</span>. ${out(p.sourceUrl, "Данные магазина ↗", "p-source-link")}</p></div></div></section>
 <section class="shell p-package-section" id="package"><h2 class="p-section-title reveal">Комплектация и документы</h2><div class="p-package-grid reveal"><div>${icon("box")}<div><h3>Комплектация выбранной версии</h3>${packageItems.length ? `<p>${packageItems.map(esc).join(" · ")}</p>` : "<p>Актуальный состав подтвердит магазин.</p>"}${out(p.sourceUrl, 'Уточнить состав <span aria-hidden="true">↗</span>', "p-underlink")}</div></div><div>${icon("doc")}<div><h3>${p.group === "accessories" ? "Совместимость и уход" : "Руководство пользователя"}</h3><p>${p.group === "accessories" ? "Информация об аксессуаре и совместимости." : "Документы для модели " + esc(p.sku) + "."}</p>${out(p.group === "accessories" ? "https://online-samsung.ru/product/" + p.sku.toLowerCase() : "https://www.samsung.com/ru/support/model/" + p.sku + "/", p.group === "accessories" ? 'Подробнее об аксессуаре <span aria-hidden="true">↗</span>' : 'Найти руководство <span aria-hidden="true">↗</span>', "p-underlink")}</div></div></div><div class="p-service-grid reveal">${serviceCard}<a href="https://online-samsung.ru/service" target="_blank" rel="noopener" class="p-service-card">${icon("shield")}<div><h3>Забота о вашем устройстве</h3><p>Сервисное обслуживание<br/>и поддержка.</p><span class="p-underlink">Гарантия и сервис ↗</span></div><svg class="icon p-service-symbol" aria-hidden="true"><use href="#i-shield"/></svg></a></div></section>
 <section class="shell p-accessories-section" id="accessories"><h2 class="p-section-title reveal">${p.group === "home" ? "Дополните пространство дома." : p.group === "accessories" ? "Продолжите знакомство с Galaxy." : "Дополните свой " + p.family + "."}</h2><div class="p-related-grid reveal">${p.related
   .filter((s) => bySlug[s])
   .map((s) => card(bySlug[s]))
   .join("")}</div></section>
 <section class="shell p-reviews-section" id="reviews"><div class="p-review-strip reveal">${icon("chat")}<div><h2>Отзывы владельцев</h2><p>Поделитесь впечатлениями о ${esc(p.shortName)}.</p></div><div class="p-review-actions">${button("Написать отзыв", 'data-feedback="review"')}${button("Задать вопрос", 'data-feedback="question"', "button p-button-outline")}</div></div></section>
 <section class="shell p-questions-section faq" id="questions"><div class="p-help-copy reveal"><h2>Уверенность<br/>перед покупкой.</h2><p>Поможем с выбором версии,<br/>оплатой и получением.</p>${link("tel:88007557525", icon("phone") + "8 800 755-7525", "p-help-phone")}</div><div class="p-faq-list reveal">${faqs(p)}</div></section>
 <div class="shell p-bottom-purchase"><div>${img(gallery[0])}<span>${esc(p.shortName)}<small data-bottom-variant>${esc(p.variant)}</small></span></div><strong data-price>${money(p.price)}*</strong>${button("Выбрать " + p.family, "data-add-cart")}</div><p class="shell p-disclaimer">* Концепция редизайна. Цена из карточки магазина на 09.11.2026; актуальные цену, наличие и условия покупки уточняйте в магазине.</p>
 </main><div class="p-sticky-buy" hidden><div class="shell"><span>${esc(p.shortName)}<small data-sticky-variant>${esc(p.variant)}</small></span><strong data-price>${money(p.price)}</strong>${button("В корзину", "data-add-cart")}</div></div>
 <dialog class="p-zoom-dialog" id="photo-dialog" aria-label="Фотографии ${esc(p.shortName)}"><button class="p-dialog-close icon-button" type="button" data-close aria-label="Закрыть фотографию">×</button><button class="p-photo-arrow p-photo-prev icon-button" type="button" data-photo-prev aria-label="Предыдущая фотография">←</button><img src="${gallery[0].file}" width="${gallery[0].width}" height="${gallery[0].height}" alt="${esc(gallery[0].alt)}"/><button class="p-photo-arrow p-photo-next icon-button" type="button" data-photo-next aria-label="Следующая фотография">→</button><p class="p-zoom-caption" aria-live="polite"></p></dialog>
 <dialog class="p-dialog" id="consult-dialog" aria-labelledby="consult-title"><button class="p-dialog-close icon-button" type="button" data-close aria-label="Закрыть">×</button><p class="eyebrow">Персональная консультация</p><h2 id="consult-title">Ваш ${p.family}.<br/>Один шаг до покупки.</h2><div class="p-consult-product">${img(gallery[0])}<div><strong>${esc(p.shortName)}</strong><p data-consult-variant>${esc(p.variant)}</p><span data-price>${money(p.price)}</span></div></div><p>Консультант подтвердит наличие и поможет оформить заказ в магазине Online Samsung.</p><a class="button button-dark" href="tel:88007557525">${icon("phone")}8 800 755-7525</a>${out(p.sourceUrl, 'Перейти в магазин <span aria-hidden="true">↗</span>', "button p-button-outline p-store-link")}<p class="p-note">Заказ оформляется на сайте или по телефону магазина.</p></dialog>
 <dialog class="p-dialog" id="feedback-dialog" aria-labelledby="feedback-title"><button class="p-dialog-close icon-button" type="button" data-close aria-label="Закрыть">×</button><p class="eyebrow">Ваш опыт с ${p.family}</p><h2 id="feedback-title">Поделитесь впечатлениями.</h2><p>Черновик сохраняется на этом устройстве. Отправить отзыв или вопрос можно в магазин.</p><form id="feedback-form"><label for="feedback-name">Как к вам обращаться</label><input id="feedback-name" name="name" maxlength="60" required autocomplete="given-name"/><label for="feedback-message">Ваш отзыв</label><textarea id="feedback-message" name="message" rows="4" maxlength="2000" required></textarea><button class="button button-dark" type="submit">Сохранить черновик</button><p class="p-feedback-status" role="status"></p></form>${out(p.sourceUrl, "Открыть карточку в магазине ↗", "p-underlink")}</dialog>
 <dialog class="p-dialog p-product-comparison" id="product-comparison-dialog" aria-labelledby="product-compare-title"><button class="p-dialog-close icon-button" type="button" data-close aria-label="Закрыть сравнение">×</button><p class="eyebrow">Выбор в деталях</p><h2 id="product-compare-title">Сравните возможности.</h2><div class="p-compare-grid">${[
   p,
   ...p.related.map((s) => bySlug[s]).filter(Boolean),
 ]
   .slice(0, 3)
   .map(
     (x) =>
       `<div>${img(x.gallery[0])}<h3>${esc(x.shortName)}</h3><p>${esc(x.variant)}</p><strong>${money(x.price)}</strong>${shortSpecRows(x.selected.slice(0, 3))}${link(x.slug + ".html", "Подробнее →", "p-underlink")}</div>`,
   )
   .join("")}</div></dialog>
 <script type="application/json" id="product-data">${json({ ...p, selectedColor: color })}</script>`;
  return base(p.name, body, { p });
}

for (const p of products) write(p.slug + ".html", productPage(p));
const catalogBody = `<main id="main"><div class="shell p-catalog-top"><nav class="p-breadcrumb" aria-label="Хлебные крошки">${link("index.html", "Главная")}<span>/</span><span>Устройства Samsung</span></nav><p class="eyebrow">Мир Samsung</p><h1 data-catalog-title>Технологии для вашего мира.</h1><p class="p-catalog-intro" data-catalog-intro>Найдите устройство, которое подходит именно вам.</p><form class="p-catalog-search" role="search"><label class="visually-hidden" for="catalog-search">Найти устройство</label>${icon("search")}<input id="catalog-search" name="q" type="search" placeholder="Найти устройство Samsung"/><button type="submit" class="button button-dark button-small">Найти</button></form><div class="p-catalog-filters" role="group" aria-label="Категории">${button("Все устройства", 'data-category="all" aria-pressed="true"', "p-filter is-active")}${Object.entries(
  groups,
)

  .map(([k, g]) =>
    button(g.name, `data-category="${k}" aria-pressed="false"`, "p-filter"),
  )
  .join(
    "",
  )}</div><div class="p-catalog-toolbar"><p data-catalog-count>${products.length} устройств</p><label>Сортировка <select id="catalog-sort"><option value="featured">Рекомендуем</option><option value="price-up">Сначала дешевле</option><option value="price-down">Сначала дороже</option></select></label></div><div class="p-catalog-grid">${products.map(card).join("")}</div><div class="p-catalog-empty" hidden><h2>Ничего не найдено.</h2><p>Попробуйте другое название или откройте все устройства.</p>${button("Показать все", "data-reset-catalog", "button button-dark")}</div><p class="p-catalog-note">Подборка устройств в концепции редизайна. Полный ассортимент и актуальное наличие — в магазине Online Samsung.</p></div><section class="shell p-catalog-help" id="questions"><div><p class="eyebrow">Помощь с выбором</p><h2>Найдём ваш Samsung.</h2><p>Расскажите о ваших задачах — консультант подберёт подходящую модель.</p></div>${link("tel:88007557525", icon("phone") + "8 800 755-7525", "button button-dark")}</section></main><script type="application/json" id="catalog-data">${json({ groups })}</script>`;
write(
  "catalog.html",
  base("Устройства Samsung", catalogBody, { catalog: true }),
);
write(
  "data/catalog.json",
  JSON.stringify(
    products.map((p) => ({
      slug: p.slug,
      name: p.name,
      shortName: p.shortName,
      variant: p.variant,
      price: p.price,
      sku: p.sku,
      image: p.gallery[0].file,
      url: p.slug + ".html",
      sourceUrl: p.sourceUrl,
      group: p.group,
    })),
    null,
    2,
  ),
);
console.log(
  `Built ${products.length} product pages and catalog.html; homepage links updated.`,
);
