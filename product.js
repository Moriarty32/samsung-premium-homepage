(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const format = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
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
      return false;
    }
  };
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.classList.add("dialog-open");
    if (!reduced.matches)
      dialog.animate(
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" },
      );
  }
  $$(".p-dialog,.p-zoom-dialog").forEach((dialog) => {
    dialog
      .querySelector("[data-close]")
      ?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]"))
        document.documentElement.classList.remove("dialog-open");
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    });
  });
  const node = $("#product-data");
  if (node) {
    const product = JSON.parse(node.textContent);
    const variants = product.variants || [];
    let selected = variants.find((v) => v.sku === product.sku) || {
      sku: product.sku,
      price: product.price,
      color: product.selectedColor,
      sourceUrl: product.sourceUrl,
      gallery: product.gallery,
      storage: "",
    };
    let gallery = selected.gallery,
      photo = 0,
      imageRequest = 0;
    const mainImage = $(".p-main-image");
    const mainLink = $("[data-gallery-open]");
    const zoom = $("#photo-dialog");
    const variantLabel = () =>
      selected.storage
        ? `${selected.storage} · ${selected.color}`
        : product.variant.replace(",", " ·");
    function applyImage(img, g) {
      img.src = g.file;
      img.alt = g.alt;
      img.width = g.width;
      img.height = g.height;
    }
    function fitGalleryImage() {
      const g = gallery[photo],
        bounds = g.bounds;
      if (!bounds) return;
      const rect = mainLink.getBoundingClientRect();
      const base = Math.min(rect.width / g.width, rect.height / g.height);
      const scale = Math.min(
        (rect.width * 0.88) / ((bounds[2] - bounds[0]) * base),
        (rect.height * 0.89) / ((bounds[3] - bounds[1]) * base),
        2.8,
      );
      mainImage.style.setProperty("--photo-scale", scale);
      mainImage.style.setProperty(
        "--photo-x",
        (g.width / 2 - (bounds[0] + bounds[2]) / 2) * base * scale + "px",
      );
      mainImage.style.setProperty(
        "--photo-y",
        (g.height / 2 - (bounds[1] + bounds[3]) / 2) * base * scale + "px",
      );
    }
    function fitZoomImage() {
      if (!zoom.open) return;
      const im = zoom.querySelector("img"),
        g = gallery[photo],
        bounds = g.bounds;
      if (!bounds || !im.clientWidth || !im.clientHeight) return;
      const base = Math.min(
        im.clientWidth / g.width,
        im.clientHeight / g.height,
      );
      const scale = Math.min(
        (im.clientWidth * 0.94) / ((bounds[2] - bounds[0]) * base),
        (im.clientHeight * 0.91) / ((bounds[3] - bounds[1]) * base),
        4,
      );
      im.style.setProperty("--zoom-scale", scale);
      im.style.setProperty(
        "--zoom-x",
        (g.width / 2 - (bounds[0] + bounds[2]) / 2) * base * scale + "px",
      );
      im.style.setProperty(
        "--zoom-y",
        (g.height / 2 - (bounds[1] + bounds[3]) / 2) * base * scale + "px",
      );
    }
    async function showPhoto(index, animate = true) {
      photo = (index + gallery.length) % gallery.length;
      const request = ++imageRequest,
        g = gallery[photo];
      // Decode before changing the frame, so a slow connection never leaves an empty gallery.
      const preload = new Image();
      preload.src = g.file;
      await preload.decode().catch(() => {});
      if (request !== imageRequest) return;
      applyImage(mainImage, g);
      mainLink.href = g.file;
      fitGalleryImage();
      if (animate && !reduced.matches)
        mainImage.animate([{ opacity: 0.25 }, { opacity: 1 }], {
          duration: 430,
          easing: "cubic-bezier(.22,1,.36,1)",
        });
      $$("[data-photo]").forEach((b, i) => {
        b.classList.toggle("is-active", i === photo);
        b.setAttribute("aria-pressed", String(i === photo));
      });
      $("[data-photo-current]").textContent = photo + 1;
      applyImage(zoom.querySelector("img"), g);
      fitZoomImage();
      zoom.querySelector(".p-zoom-caption").textContent =
        `${product.shortName} · ${variantLabel()} · ${photo + 1} / ${gallery.length}`;
    }
    $$("[data-photo]").forEach((b) =>
      b.addEventListener("click", () => showPhoto(Number(b.dataset.photo))),
    );
    let ignoreGalleryClickUntil = 0;
    mainLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (Date.now() < ignoreGalleryClickUntil) return;
      showPhoto(photo, false);
      openDialog(zoom);
      requestAnimationFrame(fitZoomImage);
    });
    $("[data-photo-prev]").addEventListener("click", () =>
      showPhoto(photo - 1),
    );
    $("[data-photo-next]").addEventListener("click", () =>
      showPhoto(photo + 1),
    );
    zoom.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        showPhoto(photo + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    let touchX = null;
    mainLink.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") touchX = event.clientX;
    });
    mainLink.addEventListener("pointerup", (event) => {
      if (touchX === null) return;
      const delta = event.clientX - touchX;
      touchX = null;
      if (Math.abs(delta) > 45) {
        event.preventDefault();
        ignoreGalleryClickUntil = Date.now() + 500;
        showPhoto(photo + (delta < 0 ? 1 : -1));
      }
    });
    mainLink.addEventListener("pointercancel", () => {
      touchX = null;
    });
    if ("ResizeObserver" in window)
      new ResizeObserver(fitGalleryImage).observe(mainLink);
    if ("ResizeObserver" in window)
      new ResizeObserver(fitZoomImage).observe(zoom);
    const colors = [...new Map(variants.map((v) => [v.colorKey, v])).values()];
    const memories = [
      ...new Map(variants.map((v) => [v.storageGb, v])).values(),
    ].sort((a, b) => a.storageGb - b.storageGb);
    if (variants.length) {
      const colorBox = $("[data-colors]");
      colorBox.replaceChildren();
      for (const color of colors) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "p-swatch";
        b.dataset.color = color.colorKey;
        b.style.setProperty("--swatch", color.colorHex);
        b.setAttribute("aria-label", color.color);
        b.title = color.color;
        b.addEventListener("click", () =>
          selectVariant(
            variants.find(
              (v) =>
                v.colorKey === color.colorKey &&
                v.storageGb === selected.storageGb,
            ) || color,
          ),
        );
        colorBox.append(b);
      }
      const memoryBox = $("[data-memory]");
      for (const memory of memories) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = memory.storageGb === 1024 ? "1 ТБ" : memory.storage;
        b.dataset.storage = memory.storageGb;
        b.addEventListener("click", () =>
          selectVariant(
            variants.find(
              (v) =>
                v.storageGb === memory.storageGb &&
                v.colorKey === selected.colorKey,
            ) || memory,
          ),
        );
        memoryBox.append(b);
      }
    }
    function markOptions() {
      $$("[data-color]").forEach((b) => {
        const active = b.dataset.color === selected.colorKey;
        b.classList.toggle("is-selected", active);
        b.setAttribute("aria-pressed", String(active));
      });
      $$("[data-storage]").forEach((b) => {
        const active = Number(b.dataset.storage) === selected.storageGb;
        b.classList.toggle("is-selected", active);
        b.setAttribute("aria-pressed", String(active));
      });
    }
    function selectVariant(v, initial = false) {
      const colorChanged = v.colorKey !== selected.colorKey;
      selected = v;
      gallery = v.gallery;
      $$("[data-price]").forEach((n) => {
        n.textContent =
          format(v.price) + (n.closest(".p-bottom-purchase") ? "*" : "");
      });
      $$(
        "[data-variant-label],[data-bottom-variant],[data-sticky-variant],[data-consult-variant]",
      ).forEach((n) => (n.textContent = variantLabel()));
      $$("[data-sku],[data-spec-sku]").forEach((n) => (n.textContent = v.sku));
      $("[data-color-label]").textContent = v.color;
      $("[data-variant-note]").textContent = variantLabel();
      $$(".p-store-link,.p-source-link").forEach((a) => (a.href = v.sourceUrl));
      $$(".p-thumbnails img").forEach((im, i) => applyImage(im, gallery[i]));
      $$(".p-bottom-purchase img,.p-consult-product img").forEach((im) =>
        applyImage(im, gallery[0]),
      );
      // The editorial photography and specifications below describe the model; memory follows the selected SKU.
      $$(
        ".p-configuration .p-spec-list>div,.p-details-grid .p-spec-list>div",
      ).forEach((row) => {
        const label = row.querySelector("dt").textContent;
        if (
          /^(Память, ГБ|Встроенная память \(ROM\), Гб)$/.test(label) &&
          v.storageGb
        )
          row.querySelector("dd").textContent = v.storageGb;
        if (
          /^(Оперативная память, ГБ|Оперативная память \(RAM\), Гб)$/.test(
            label,
          ) &&
          v.ramGb
        )
          row.querySelector("dd").textContent = v.ramGb;
        if (/^(Цвет палитра|Цвет|цвет)$/.test(label))
          row.querySelector("dd").textContent = v.color;
      });
      markOptions();
      updateFavorite();
      showPhoto(colorChanged ? 0 : photo, !initial);
      if (!initial) {
        const url = new URL(location.href);
        url.searchParams.set("sku", v.sku);
        history.replaceState(null, "", url);
        window.SamsungCart?.announce(
          "Выбрано: " + variantLabel() + ". " + format(v.price),
        );
      }
    }
    const favoriteButton = $("[data-favorite]");
    const FAVORITES = "samsung-demo-favorites-v1";
    function favorites() {
      const saved = readStored(FAVORITES, []);
      return Array.isArray(saved)
        ? saved.filter((x) => typeof x === "string")
        : [];
    }
    function updateFavorite() {
      const active = favorites().includes(selected.sku);
      favoriteButton.setAttribute("aria-pressed", String(active));
      favoriteButton.querySelector("span").textContent = active
        ? "В избранном"
        : "В избранное";
    }
    favoriteButton.addEventListener("click", () => {
      let saved = favorites();
      const active = saved.includes(selected.sku);
      saved = active
        ? saved.filter((x) => x !== selected.sku)
        : [...saved, selected.sku];
      const persisted = saveStored(FAVORITES, saved);
      if (persisted) updateFavorite();
      window.SamsungCart?.announce(
        persisted
          ? active
            ? "Товар удалён из избранного."
            : "Товар сохранён в избранном."
          : "Браузер не разрешает сохранить избранное.",
      );
    });
    $("[data-product-compare]").addEventListener("click", () =>
      openDialog(
        product.group === "smartphones"
          ? $("#comparison-dialog")
          : $("#product-comparison-dialog"),
      ),
    );
    $$("[data-add-cart]").forEach((b) =>
      b.addEventListener("click", () =>
        window.SamsungCart?.add({
          sku: selected.sku,
          name: product.shortName,
          variant: variantLabel(),
          price: selected.price,
          image: gallery[0].file,
          url: product.slug + ".html?sku=" + encodeURIComponent(selected.sku),
          sourceUrl: selected.sourceUrl,
        }),
      ),
    );
    $$("[data-consult]").forEach((b) =>
      b.addEventListener("click", () => {
        const h = $("#consult-title");
        h.replaceChildren();
        if (b.dataset.consult === "availability")
          h.textContent = "Уточним наличие.";
        else {
          h.append(
            document.createTextNode("Ваш " + product.family + "."),
            document.createElement("br"),
            document.createTextNode("Один шаг до покупки."),
          );
        }
        openDialog($("#consult-dialog"));
      }),
    );
    const feedback = $("#feedback-dialog"),
      form = $("#feedback-form");
    let feedbackType = "review";
    const draftKey = () => `samsung-draft-${product.slug}-${feedbackType}`;
    $$("[data-feedback]").forEach((b) =>
      b.addEventListener("click", () => {
        feedbackType = b.dataset.feedback;
        const question = feedbackType === "question";
        $("#feedback-title").textContent = question
          ? "Что вас интересует?"
          : "Поделитесь впечатлениями.";
        form.querySelector('label[for="feedback-message"]').textContent =
          question ? "Ваш вопрос" : "Ваш отзыв";
        const draft = readStored(draftKey(), {});
        form.elements.name.value =
          typeof draft.name === "string" ? draft.name : "";
        form.elements.message.value =
          typeof draft.message === "string" ? draft.message : "";
        $(".p-feedback-status").textContent = "";
        openDialog(feedback);
      }),
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const ok = saveStored(draftKey(), {
        name: form.elements.name.value.trim(),
        message: form.elements.message.value.trim(),
      });
      $(".p-feedback-status").textContent = ok
        ? "Черновик сохранён на этом устройстве. Для публикации откройте карточку в магазине."
        : "Браузер не разрешает сохранить черновик. Скопируйте текст перед закрытием.";
    });
    if ("IntersectionObserver" in window) {
      const sticky = $(".p-sticky-buy"),
        purchase = $("#purchase"),
        bottom = $(".p-bottom-purchase"),
        footer = $(".site-footer");
      let past = false,
        atEnd = false;
      const updateSticky = () => {
        sticky.hidden = !past || atEnd;
      };
      new IntersectionObserver(
        (entries) => {
          past = entries[0].boundingClientRect.bottom < 0;
          updateSticky();
        },
        { threshold: 0 },
      ).observe(purchase);
      const endObserver = new IntersectionObserver((entries) => {
        atEnd =
          entries.some((e) => e.isIntersecting) ||
          [bottom, footer].some((e) => {
            const r = e.getBoundingClientRect();
            return r.top < innerHeight && r.bottom > 0;
          });
        updateSticky();
      });
      endObserver.observe(bottom);
      endObserver.observe(footer);
      const anchors = $$(".p-section-nav a");
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            anchors.forEach((a) => {
              const active = a.hash === "#" + entry.target.id;
              a.classList.toggle("is-active", active);
              if (active) a.setAttribute("aria-current", "location");
              else a.removeAttribute("aria-current");
            });
          }
        },
        { rootMargin: "-90px 0px -60% 0px", threshold: 0 },
      );
      anchors.forEach((a) => {
        const section = $(a.hash);
        if (section) sectionObserver.observe(section);
      });
    }
    const requested = new URLSearchParams(location.search).get("sku");
    selectVariant(variants.find((v) => v.sku === requested) || selected, true);
    window.addEventListener("storage", (event) => {
      if (event.key === FAVORITES) updateFavorite();
    });
  }
  const catalogNode = $("#catalog-data");
  $$(".p-feature-visual").forEach((box) => {
    const bounds = JSON.parse(box.dataset.imageBounds),
      im = box.querySelector("img");
    if (!bounds) return;
    const width = Number(im.getAttribute("width")),
      height = Number(im.getAttribute("height"));
    const fit = () => {
      const r = box.getBoundingClientRect(),
        base = Math.min(r.width / width, r.height / height);
      const scale = Math.min(
        (r.width * 0.88) / ((bounds[2] - bounds[0]) * base),
        (r.height * 0.86) / ((bounds[3] - bounds[1]) * base),
        4,
      );
      im.style.setProperty("--feature-scale", scale);
      im.style.setProperty(
        "--feature-x",
        (width / 2 - (bounds[0] + bounds[2]) / 2) * base * scale + "px",
      );
      im.style.setProperty(
        "--feature-y",
        (height / 2 - (bounds[1] + bounds[3]) / 2) * base * scale + "px",
      );
    };
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(box);
  });
  if (catalogNode) {
    const { groups } = JSON.parse(catalogNode.textContent);
    const cards = $$("[data-product-card]");
    const params = new URLSearchParams(location.search);
    let category = params.get("category") || "all";
    if (!groups[category]) category = "all";
    const input = $("#catalog-search");
    input.value = params.get("q") || "";
    const normalize = (s) => s.toLowerCase().replace(/ё/g, "е");
    function filter(updateUrl = true) {
      const query = normalize(input.value.trim());
      let count = 0;
      for (const card of cards) {
        const categoryMatch =
          category === "all" ||
          card.dataset.group === category ||
          card.dataset.parentGroup === category ||
          (category === "mobile" &&
            ["smartphones", "tablets", "watches", "audio"].includes(
              card.dataset.group,
            )) ||
          (category === "extras" &&
            ["watches", "audio", "accessories"].includes(card.dataset.group)) ||
          (category === "wearables" &&
            ["audio", "watches"].includes(card.dataset.group));
        card.hidden =
          !categoryMatch ||
          (query && !normalize(card.textContent).includes(query));
        if (!card.hidden) count++;
      }
      $$("[data-category]").forEach((b) => {
        const active = b.dataset.category === category;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      $("[data-catalog-title]").textContent =
        groups[category]?.name || "Технологии для вашего мира.";
      $("[data-catalog-intro]").textContent =
        groups[category]?.intro ||
        "Найдите устройство, которое подходит именно вам.";
      $("[data-catalog-count]").textContent =
        count +
        " " +
        (count === 1
          ? "устройство"
          : count > 1 && count < 5
            ? "устройства"
            : "устройств");
      $(".p-catalog-empty").hidden = count !== 0;
      document.title =
        (groups[category]?.name || "Устройства Samsung") + " — Online Samsung";
      if (updateUrl) {
        const url = new URL(location.href);
        if (category === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", category);
        if (query) url.searchParams.set("q", input.value.trim());
        else url.searchParams.delete("q");
        history.replaceState(null, "", url);
      }
    }
    $$("[data-category]").forEach((b) =>
      b.addEventListener("click", () => {
        category = b.dataset.category;
        filter();
      }),
    );
    $(".p-catalog-search").addEventListener("submit", (event) => {
      event.preventDefault();
      filter();
    });
    input.addEventListener("input", () => filter());
    $("[data-reset-catalog]").addEventListener("click", () => {
      category = "all";
      input.value = "";
      filter();
      input.focus();
    });
    $("#catalog-sort").addEventListener("change", (event) => {
      const sorted = [...cards];
      if (event.target.value !== "featured")
        sorted.sort((a, b) => {
          const price = (x) =>
            Number(
              x
                .querySelector(".p-related-price")
                .textContent.replace(/\D/g, ""),
            );
          return (
            (price(a) - price(b)) * (event.target.value === "price-up" ? 1 : -1)
          );
        });
      const grid = $(".p-catalog-grid");
      sorted.forEach((card) => grid.append(card));
    });
    filter(false);
  }
})();
