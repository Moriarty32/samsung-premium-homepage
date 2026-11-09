import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// Public Drupal HTML is fetched at build time: the browser never needs cross-origin access.
// A failed import leaves the last checked JSON snapshot and published homepage intact.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = "https://online-samsung.ru/station";
const check = process.argv.includes("--check");
const decode = (s) =>
  s
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) =>
      String.fromCodePoint(
        n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n),
      ),
    )
    .replace(
      /&(amp|quot|apos|nbsp|laquo|raquo|mdash|ndash|hellip);/g,
      (_, n) =>
        ({
          amp: "&",
          quot: '"',
          apos: "'",
          nbsp: " ",
          laquo: "«",
          raquo: "»",
          mdash: "—",
          ndash: "–",
          hellip: "…",
        })[n],
    );
const plain = (s) =>
  decode(s.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((m) => [
      m[1].toLowerCase(),
      decode(m[3]),
    ]),
  );
}
async function get(url) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: {
      "User-Agent": "SamsungRedesignContent/1.0",
      Accept: "text/html,image/*;q=0.8",
    },
  });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
}
function articleUrl(url) {
  const parsed = new URL(url, source);
  if (
    parsed.origin !== "https://online-samsung.ru" ||
    !parsed.pathname.startsWith("/station/")
  )
    throw new Error("Untrusted article URL");
  return parsed.href;
}
const html = await (await get(source)).text();
const parsed = [];
for (const match of html.matchAll(
  /<article\b[^>]*class=["'][^"']*\bcatalog-news__item\b[^"']*["'][^>]*>[\s\S]*?<\/article>/g,
)) {
  const card = match[0];
  const anchor = card.match(
    /<a\b[^>]*class=["'][^"']*\bcatalog-news__item-link\b[^"']*["'][^>]*>/,
  )?.[0];
  const time = card.match(/<time\b[^>]*>/)?.[0];
  const image = card.match(/<img\b[^>]*>/)?.[0];
  if (!anchor || !time || !image) continue;
  const a = attributes(anchor),
    t = attributes(time),
    im = attributes(image);
  const title = plain(
    card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1] || a.title || "",
  );
  if (
    !title ||
    !a.href ||
    !t.datetime ||
    !Number.isFinite(Date.parse(t.datetime)) ||
    !im.src
  )
    continue;
  const url = articleUrl(a.href);
  const imageUrl = new URL(im.src, source);
  if (imageUrl.origin !== "https://online-samsung.ru") continue;
  parsed.push({
    title,
    url,
    date: t.datetime,
    sourceUrl: url,
    imageUrl: imageUrl.href,
    width: Number(im.width) || 390,
    height: Number(im.height) || 260,
  });
}
const articles = [...new Map(parsed.map((a) => [a.url, a])).values()]
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  .slice(0, 6);
if (articles.length < 3)
  throw new Error(
    `Expected at least 3 dated articles; found ${articles.length}. Previous content retained.`,
  );
if (check) {
  console.log(
    JSON.stringify(
      {
        source,
        parsed: parsed.length,
        latest: articles.map(({ title, url, date }) => ({ title, url, date })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const config = JSON.parse(
  fs.readFileSync(path.join(root, "data/home-editorial.json"), "utf8"),
);
const folder = path.join(root, "assets/journal-feed");
fs.mkdirSync(folder, { recursive: true });
const imported = [];
for (const a of articles) {
  const override = config.journal.overrides[a.url];
  let image = override?.image;
  if (!image) {
    const response = await get(a.imageUrl);
    const type = response.headers.get("content-type")?.split(";")[0];
    const ext = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/avif": "avif",
    }[type];
    if (!ext) throw new Error("Unsupported article image type: " + type);
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > 5 * 1024 * 1024 || body.length < 100)
      throw new Error("Unexpected article image size");
    const filename =
      crypto
        .createHash("sha256")
        .update(a.imageUrl)
        .digest("hex")
        .slice(0, 14) +
      "." +
      ext;
    fs.writeFileSync(path.join(folder, filename), body);
    image = {
      file: "assets/journal-feed/" + filename,
      width: a.width,
      height: a.height,
      sourceUrl: a.imageUrl,
      alt: a.title,
    };
  }
  imported.push({
    title: a.title,
    url: a.url,
    date: a.date,
    sourceUrl: a.url,
    image,
  });
}
const output = {
  sourceUrl: source,
  capturedAt: new Date().toISOString(),
  selection:
    "Six newest dated catalog-news articles; featured duplicates excluded.",
  articles: imported,
};
const target = path.join(root, "data/journal-feed.json"),
  temp = target + ".tmp";
fs.writeFileSync(temp, JSON.stringify(output, null, 2) + "\n");
fs.renameSync(temp, target);
console.log(
  `Imported ${imported.length} dated blog articles from ${source}. Run node scripts/build-site.mjs to update the homepage.`,
);
