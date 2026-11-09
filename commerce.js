(() => {
  "use strict";
  const KEY = "samsung-demo-cart-v1";
  const format = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  const safeRead = () => {
    try {
      const items = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(items)
        ? items
            .filter(
              (x) =>
                x &&
                /^[a-zA-Z0-9-]{3,40}$/.test(x.sku) &&
                typeof x.name === "string" &&
                typeof x.variant === "string" &&
                /^assets\/(?:products\/[a-z0-9-]+\/[a-z0-9-]+|(?:homepage-products|category-products)\/[a-z0-9-]+)\.webp$/.test(
                  x.image,
                ) &&
                /^(?:[a-z0-9-]+\.html(?:\?sku=[A-Za-z0-9-]+)?|https:\/\/online-samsung\.ru\/product\/[a-z0-9-]+)$/.test(
                  x.url,
                ) &&
                /^https:\/\/online-samsung\.ru\/product\/[a-z0-9-]+$/.test(
                  x.sourceUrl,
                ) &&
                Number.isFinite(x.price) &&
                x.price > 0 &&
                Number.isInteger(x.qty) &&
                x.qty > 0 &&
                x.qty <= 10,
            )
            .slice(0, 30)
        : [];
    } catch {
      return [];
    }
  };
  let cart = safeRead();
  const dialog = document.createElement("dialog");
  dialog.id = "cart-dialog";
  dialog.className = "c-cart-dialog";
  dialog.setAttribute("aria-labelledby", "cart-title");
  dialog.innerHTML = `<div class="c-cart-heading"><div><p>Ваш выбор</p><h2 id="cart-title">Корзина</h2></div><button class="icon-button c-cart-close" type="button" aria-label="Закрыть корзину">×</button></div><div class="c-cart-content"></div><div class="c-cart-summary"></div><p class="c-cart-note">Это демонстрационная корзина. Покупка оформляется в магазине Online Samsung по ссылке выбранного товара.</p><a class="c-cart-phone" href="tel:88007557525">Помощь с заказом · 8 800 755-7525 ↗</a>`;
  document.body.append(dialog);
  const content = dialog.querySelector(".c-cart-content");
  const summary = dialog.querySelector(".c-cart-summary");
  const status = document.createElement("div");
  status.className = "c-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  document.body.append(status);
  const toast = document.createElement("div");
  toast.className = "a-toast";
  toast.hidden = true;
  document.body.append(toast);
  let toastTimer;
  const e = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function announce(message) {
    status.textContent = message;
    if (
      /сохранён в избранном|удалён из избранного|не разрешает сохранить|корзина сохраняется/.test(
        message,
      )
    ) {
      toast.replaceChildren(document.createTextNode(message));
      if (/сохранён в избранном/.test(message)) {
        const link = document.createElement("a");
        link.href = "catalog.html?favorites=1";
        link.textContent = "Посмотреть";
        toast.append(link);
      }
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        if (!toast.contains(document.activeElement)) toast.hidden = true;
      }, 4800);
    }
  }
  function favoriteCounts() {
    let saved = [];
    try {
      const raw = JSON.parse(
        localStorage.getItem("samsung-demo-favorites-v1") || "[]",
      );
      if (Array.isArray(raw))
        saved = [...new Set(raw.filter((s) => typeof s === "string"))];
    } catch {}
    document.querySelectorAll("[data-favorites-open]").forEach((a) => {
      a.setAttribute(
        "aria-label",
        saved.length ? `Избранное, товаров: ${saved.length}` : "Избранное",
      );
      let badge = a.querySelector(".a-favorite-count");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "a-favorite-count";
        badge.setAttribute("aria-hidden", "true");
        a.append(badge);
      }
      badge.textContent = saved.length;
      badge.hidden = !saved.length;
      if (
        location.pathname.endsWith("catalog.html") &&
        new URLSearchParams(location.search).get("favorites") === "1"
      )
        a.setAttribute("aria-current", "page");
    });
  }
  addEventListener("samsung:favorites-changed", favoriteCounts);
  favoriteCounts();
  function counts() {
    const count = cart.reduce((sum, x) => sum + x.qty, 0);
    document.querySelectorAll("[data-cart-open]").forEach((a) => {
      a.setAttribute(
        "aria-label",
        count ? `Корзина, товаров: ${count}` : "Корзина",
      );
      let badge = a.querySelector(".c-cart-count");
      if (!badge) {
        badge = e("span", "c-cart-count");
        badge.setAttribute("aria-hidden", "true");
        a.append(badge);
      }
      badge.textContent = count;
      badge.hidden = !count;
    });
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      announce(
        "В этом браузере корзина сохраняется только до закрытия страницы.",
      );
    }
    counts();
  }
  function render() {
    content.replaceChildren();
    summary.replaceChildren();
    if (!cart.length) {
      const empty = e("div", "c-cart-empty");
      empty.append(
        e("h3", "", "Ваш выбор ещё впереди."),
        e(
          "p",
          "",
          "Откройте устройства Samsung и добавьте понравившееся в корзину.",
        ),
      );
      const browse = e("a", "button button-dark", "Выбрать устройство");
      browse.href = "catalog.html";
      empty.append(browse);
      content.append(empty);
      dialog.querySelector(".c-cart-note").hidden = true;
    } else {
      dialog.querySelector(".c-cart-note").hidden = false;
      for (const item of cart) {
        const row = e("article", "c-cart-item");
        const photo = e("a", "c-cart-image");
        photo.href = item.url;
        const picture = e("img");
        picture.src = item.image;
        picture.alt = item.name;
        picture.width = 140;
        picture.height = 140;
        photo.append(picture);
        const copy = e("div", "c-cart-copy");
        const name = e("a", "c-cart-name", item.name);
        name.href = item.url;
        copy.append(
          name,
          e("p", "c-cart-variant", item.variant),
          e("strong", "c-cart-price", format(item.price)),
        );
        const controls = e("div", "c-cart-controls");
        const minus = e("button", "", "−");
        minus.type = "button";
        minus.setAttribute("aria-label", "Уменьшить количество " + item.name);
        minus.disabled = item.qty <= 1;
        const qty = e("span", "", String(item.qty));
        qty.setAttribute("aria-label", "Количество: " + item.qty);
        const plus = e("button", "", "+");
        plus.type = "button";
        plus.setAttribute("aria-label", "Увеличить количество " + item.name);
        plus.disabled = item.qty >= 10;
        const remove = e("button", "c-cart-remove", "Удалить");
        remove.type = "button";
        remove.setAttribute("aria-label", "Удалить " + item.name);
        function change(delta) {
          item.qty += delta;
          save();
          render();
          const next = content.querySelector(
            `[data-sku="${item.sku}"] ${delta > 0 ? "[data-plus]" : "[data-minus]"}`,
          );
          if (next && !next.disabled) next.focus();
          else
            content
              .querySelector(
                `[data-sku="${item.sku}"] ${delta > 0 ? "[data-minus]" : "[data-plus]"}`,
              )
              ?.focus();
          announce("Количество " + item.name + ": " + item.qty);
        }
        minus.dataset.minus = "";
        plus.dataset.plus = "";
        row.dataset.sku = item.sku;
        minus.addEventListener("click", () => change(-1));
        plus.addEventListener("click", () => change(1));
        remove.addEventListener("click", () => {
          cart = cart.filter((x) => x.sku !== item.sku);
          save();
          render();
          content.querySelector("a")?.focus();
          announce(item.name + " удалён из корзины.");
        });
        controls.append(minus, qty, plus, remove);
        copy.append(controls);
        const store = e("a", "c-cart-store", "Оформить в магазине ↗");
        store.href = item.sourceUrl;
        store.target = "_blank";
        store.rel = "noopener";
        copy.append(store);
        row.append(photo, copy);
        content.append(row);
      }
      summary.append(
        e("span", "", "Итого"),
        e(
          "strong",
          "",
          format(cart.reduce((sum, x) => sum + x.price * x.qty, 0)),
        ),
      );
    }
    counts();
  }
  function open() {
    toast.hidden = true;
    render();
    if (!dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add("dialog-open");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        dialog.animate(
          [
            { opacity: 0, transform: "translateX(24px)" },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 360, easing: "cubic-bezier(.22,1,.36,1)" },
        );
    }
  }
  dialog
    .querySelector(".c-cart-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]"))
      document.documentElement.classList.remove("dialog-open");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
  document.querySelectorAll("[data-cart-open]").forEach((a) =>
    a.addEventListener("click", (event) => {
      event.preventDefault();
      open();
    }),
  );
  window.SamsungCart = {
    add(item) {
      const existing = cart.find((x) => x.sku === item.sku);
      if (existing) {
        existing.qty = Math.min(existing.qty + 1, 10);
      } else {
        cart.push({ ...item, qty: 1 });
      }
      save();
      open();
      announce(item.name + " добавлен в корзину.");
    },
    open,
    announce,
  };
  window.addEventListener("storage", (event) => {
    if (event.key === "samsung-demo-favorites-v1" || event.key === null)
      favoriteCounts();
    if (event.key === KEY || event.key === null) {
      cart = safeRead();
      counts();
      if (dialog.open) render();
    }
  });
  counts();
})();
