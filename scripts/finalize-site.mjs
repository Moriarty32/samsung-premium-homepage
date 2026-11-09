import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// One shared shell, applied after all page builders. Safe to run repeatedly.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = "20261109-audit-1";
const categories = [
  ["smartphones.html", "Смартфоны"],
  ["televisions.html", "Телевизоры"],
  ["home-appliances.html", "Для дома"],
  ["tablets.html", "Планшеты"],
  ["watches.html", "Часы"],
  ["headphones.html", "Наушники"],
  ["accessories.html", "Аксессуары"],
  ["refrigerators.html", "Холодильники"],
  ["vacuum-cleaners.html", "Пылесосы"],
];
const icon = (n) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const heart =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 4.5a5.3 5.3 0 0 0-7.5 0L12 5.6l-1.1-1.1a5.3 5.3 0 0 0-7.5 7.5L12 21l8.5-9a5.3 5.3 0 0 0 0-7.5Z"/></svg>';
const out = (url, label) =>
  `<a href="https://online-samsung.ru/${url}" target="_blank" rel="noopener">${label}</a>`;
for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  let html = fs.readFileSync(path.join(root, file), "utf8");
  const home = file === "index.html",
    support = home ? "#faq" : "#questions";
  const navLink = ([url, name]) =>
    `<a href="${url}"${file === url ? ' aria-current="page"' : ""}>${name}</a>`;
  const topbar = `<div class="p-topbar"><div class="shell"><a class="p-top-phone" href="tel:88007557525">8 800 755-7525</a><span class="a-store-caption">Авторизованный фирменный магазин</span><div>${out("delivery", "Доставка")}${out("payment", "Оплата")}<a href="${support}">Поддержка</a></div></div></div>`;
  const header = `<header class="site-header" id="top">
    <div class="nav-bar shell">
      <a class="brand" href="index.html" aria-label="Online Samsung — на главную"><img src="assets/client-logo.svg" width="166" height="40" alt="Samsung — авторизованный фирменный магазин"/></a>
      <button class="a-catalog-toggle" id="menu-toggle" type="button" aria-label="Открыть каталог" aria-expanded="false" aria-controls="mobile-nav">${icon("menu")}<span>Каталог</span></button>
      <nav class="desktop-nav" aria-label="Основная навигация">${categories.slice(0, 6).map(navLink).join("")}</nav>
      <div class="nav-actions">
        <button class="icon-button" id="search-toggle" type="button" aria-label="Открыть поиск по каталогу" aria-expanded="false" aria-controls="search-panel">${icon("search")}</button>
        <a class="icon-button a-favorites-link" href="catalog.html?favorites=1" aria-label="Избранное" data-favorites-open>${heart}</a>
        <a class="icon-button" href="https://online-samsung.ru/cart" data-cart-open aria-controls="cart-dialog" aria-label="Корзина">${icon("bag")}</a>
      </div>
    </div>
    <div class="search-panel shell" id="search-panel" hidden><form action="catalog.html" method="get" role="search"><label for="site-search">Что вы ищете?</label><div class="search-field">${icon("search")}<input id="site-search" name="q" type="search" placeholder="Например, Galaxy S26 Ultra" required autocomplete="off"/><button class="search-submit" type="submit">Найти <span aria-hidden="true">→</span></button><button class="icon-button" id="search-close" type="button" aria-label="Закрыть поиск">×</button></div></form><div class="search-suggestions"><span>Популярное:</span><a href="galaxy-s26-ultra.html">Galaxy S26 Ultra</a><a href="televisions.html">Телевизоры</a><a href="home-appliances.html">Для дома</a></div></div>
    <nav class="mobile-nav a-catalog-menu shell" id="mobile-nav" aria-label="Все категории" hidden><div class="a-menu-heading"><span>Найдите своё устройство</span><a class="text-link" href="catalog.html">Весь каталог <span aria-hidden="true">→</span></a></div><div class="a-menu-grid">${categories.map(navLink).join("")}</div><div class="a-menu-bottom">${out("user/login", "Личный кабинет ↗")}<a href="catalog.html?favorites=1">Избранное</a><a href="tel:88007557525">Помощь с выбором</a></div></nav>
  </header>`;
  html = html.replace(/<header\b[\s\S]*?<\/header>/, header);
  html = html.replace(/<a\s+class="announcement"[\s\S]*?<\/a\s*>/, "");
  html = html.replace(/<div class="p-topbar">[\s\S]*?(?=<header\b)/, "");
  html = html.replace(
    '<header class="site-header"',
    topbar + '<header class="site-header"',
  );
  html = html.replace(/<link rel="stylesheet" href="audit\.css[^>]*>\s*/g, "");
  html = html.replace(/<noscript data-shared-nav>[\s\S]*?<\/noscript>\s*/g, "");
  html = html.replace(
    "</head>",
    `<link rel="stylesheet" href="audit.css?v=${version}"/><noscript data-shared-nav><style>.a-catalog-menu[hidden]{display:block!important}.a-catalog-toggle,#search-toggle,[data-favorites-open]{display:none!important}</style></noscript>\n</head>`,
  );
  html = html.replace(
    /((?:design|commerce|product|category|home-merch)\.(?:css|js)|script\.js)\?v=[^"\s]+/g,
    `$1?v=${version}`,
  );
  // All category destinations remain reachable from every footer.
  html = html.replace(
    /<h3>Устройства<\/h3>[\s\S]*?(?=<\/div>)/,
    `<h3>Устройства</h3>${categories.map(navLink).join("")}`,
  );
  fs.writeFileSync(
    path.join(root, file),
    html.replace(/[ \t]+$/gm, "").trimEnd() + "\n",
  );
}
console.log("Unified navigation, footer and design layer: 21 pages.");
