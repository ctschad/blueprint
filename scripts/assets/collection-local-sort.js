(function () {
  const SORT_PARAM = "sort_by";
  const SEARCH_PARAM = "q";
  const SORT_VALUES = new Set([
    "manual",
    "created-descending",
    "price-ascending",
    "price-descending"
  ]);
  const SORT_INPUT_SELECTOR = 'input[type="checkbox"][data-sort-value]';
  const SUMMARY_IDS = ["mobile-sort-selected", "intermediate-sort-selected"];
  const EMPTY_MESSAGE_ID = "local-search-empty-message";
  const SEARCH_STYLE_ID = "local-search-style";
  const BRAND_TITLE = "Blueprint Bryan Johnson";

  function normalizeSortValue(sortValue) {
    return SORT_VALUES.has(sortValue) ? sortValue : "";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\u2018\u2019']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokenizeSearchQuery(searchQuery) {
    const normalized = normalizeText(searchQuery);
    return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  }

  function parsePriceText(card) {
    const priceText = card.querySelector(".mobile-price span, .product-card-button .desktop:last-child");
    if (!priceText) {
      return 0;
    }

    const normalizedPrice = priceText.textContent.replace(/[^0-9.]/g, "");
    return Math.round(Number(normalizedPrice || "0") * 100);
  }

  function buildSearchText(card, titleLink, button) {
    const image = card.querySelector("img");
    const rawText = [
      titleLink ? titleLink.textContent : "",
      image ? image.alt : "",
      card.getAttribute("data-pdp-keywords") || "",
      card.getAttribute("data-product-collections") || "",
      button ? button.getAttribute("data-product-url") || "" : ""
    ].join(" ");

    return normalizeText(rawText);
  }

  function buildProducts(grid) {
    const productData = window.igProductData || {};

    return Array.from(grid.querySelectorAll(".product-card")).map((card, originalIndex) => {
      const button = card.querySelector(".product-card-button[data-product-id]");
      const titleLink = card.querySelector(".product-card-title");
      const productId = button ? button.getAttribute("data-product-id") || "" : "";
      const metadata = productData[productId] || {};
      const lowestVariantPrice = Number(metadata.lowestVariantPrice);

      return {
        card,
        originalIndex,
        price: Number.isFinite(lowestVariantPrice) ? lowestVariantPrice : parsePriceText(card),
        productId: Number(productId) || 0,
        searchText: buildSearchText(card, titleLink, button)
      };
    });
  }

  function compareProducts(sortValue) {
    return function (left, right) {
      if (sortValue === "price-ascending" && left.price !== right.price) {
        return left.price - right.price;
      }

      if (sortValue === "price-descending" && left.price !== right.price) {
        return right.price - left.price;
      }

      if (sortValue === "created-descending" && left.productId !== right.productId) {
        return right.productId - left.productId;
      }

      return left.originalIndex - right.originalIndex;
    };
  }

  function renderProducts(grid, products, sortValue) {
    const sortedProducts = products.slice().sort(compareProducts(sortValue));

    sortedProducts.forEach((product) => {
      grid.appendChild(product.card);
    });
  }

  function updateSummaries(sortValue) {
    const summaryText = sortValue ? "1 selected" : "0 selected";

    SUMMARY_IDS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = summaryText;
      }
    });
  }

  function syncInputs(sortValue) {
    document.querySelectorAll(SORT_INPUT_SELECTOR).forEach((input) => {
      input.checked = Boolean(sortValue) && input.getAttribute("data-sort-value") === sortValue;
    });

    updateSummaries(sortValue);
  }

  function updateUrl(sortValue) {
    const url = new URL(window.location.href);

    if (sortValue) {
      url.searchParams.set(SORT_PARAM, sortValue);
    } else {
      url.searchParams.delete(SORT_PARAM);
    }

    window.history.replaceState({}, "", url.toString());
  }

  function ensureSearchStyles() {
    if (document.getElementById(SEARCH_STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = SEARCH_STYLE_ID;
    style.textContent = [
      '#items-grid .product-card[data-local-search-match="false"] {',
      "  display: none !important;",
      "}",
      ".local-search-empty-message {",
      "  display: none;",
      "  margin: 0 0 1.5rem;",
      "  color: rgba(var(--colors-text), 0.8);",
      "  font-size: 1rem;",
      "  line-height: 1.5;",
      "}",
      ".local-search-empty-message[data-visible=\"true\"] {",
      "  display: block;",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function updateResultCount(visibleCount) {
    const countEl = document.getElementById("mobile-filter-product-count-number");
    if (countEl) {
      countEl.textContent = String(visibleCount);
    }
  }

  function getOrCreateEmptyMessage(grid) {
    let message = document.getElementById(EMPTY_MESSAGE_ID);
    if (message) {
      return message;
    }

    message = document.createElement("p");
    message.id = EMPTY_MESSAGE_ID;
    message.className = "local-search-empty-message";
    grid.parentNode.insertBefore(message, grid);
    return message;
  }

  function updateSearchPresentation(grid, rawQuery, visibleCount) {
    const query = String(rawQuery || "").trim();
    if (!query) {
      return;
    }

    const title = document.querySelector(".collection-banner h1");
    const description = document.querySelector(".collection-description");
    const emptyMessage = getOrCreateEmptyMessage(grid);
    const escapedQuery = escapeHtml(query);

    if (title) {
      title.textContent = "Search Results";
    }

    if (description) {
      if (visibleCount === 1) {
        description.innerHTML = 'Showing 1 result for <strong>"' + escapedQuery + '"</strong>.';
      } else {
        description.innerHTML = 'Showing ' + visibleCount + ' results for <strong>"' + escapedQuery + '"</strong>.';
      }
    }

    if (visibleCount === 0) {
      emptyMessage.textContent = 'No products matched "' + query + '". Try a broader search.';
      emptyMessage.setAttribute("data-visible", "true");
    } else {
      emptyMessage.textContent = "";
      emptyMessage.setAttribute("data-visible", "false");
    }

    document.querySelectorAll('input[name="q"]').forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.value = query;
      }
    });

    document.title = "Search: " + query + " | " + BRAND_TITLE;
    updateResultCount(visibleCount);
  }

  function applySearch(products, rawQuery) {
    const tokens = tokenizeSearchQuery(rawQuery);
    let visibleCount = 0;

    products.forEach((product) => {
      const matches = !tokens.length || tokens.every((token) => product.searchText.includes(token));
      product.card.setAttribute("data-local-search-match", matches ? "true" : "false");
      if (matches) {
        visibleCount += 1;
      }
    });

    return visibleCount;
  }

  document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("items-grid");
    if (!grid) {
      return;
    }

    const products = buildProducts(grid);
    if (!products.length) {
      return;
    }

    ensureSearchStyles();

    const url = new URL(window.location.href);
    const initialSortValue = normalizeSortValue(url.searchParams.get(SORT_PARAM) || "");
    const initialSearchQuery = url.searchParams.get(SEARCH_PARAM) || "";

    function applySort(sortValue) {
      const normalizedSortValue = normalizeSortValue(sortValue);
      syncInputs(normalizedSortValue);
      renderProducts(grid, products, normalizedSortValue);
      updateUrl(normalizedSortValue);
    }

    document.addEventListener(
      "change",
      function (event) {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.matches(SORT_INPUT_SELECTOR)) {
          return;
        }

        const sortValue = target.checked ? target.getAttribute("data-sort-value") || "" : "";
        event.stopImmediatePropagation();
        applySort(sortValue);
      },
      true
    );

    syncInputs(initialSortValue);
    renderProducts(grid, products, initialSortValue);

    const visibleCount = applySearch(products, initialSearchQuery);
    if (initialSearchQuery) {
      updateSearchPresentation(grid, initialSearchQuery, visibleCount);
    } else {
      updateResultCount(products.length);
    }
  });
})();
