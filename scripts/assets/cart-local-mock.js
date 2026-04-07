(function () {
  var STORAGE_KEY = "blueprint-local-cart-mock";
  var BASE_PATH = "/blueprint.bryanjohnson.com";
  var CART_PAGE_PATH = BASE_PATH + "/cart.html";
  var CART_ROOT_PATH = "/cart/";
  var CART_HTML_ROOT_PATH = "/cart.html";
  var DRAWER_ROOT_ID = "local-cart-drawer-root";
  var LIVE_REGION_ID = "local-cart-live-region";
  var OPEN_CLASS = "local-cart-drawer-open";
  var pendingContextByVariantId = {};
  var drawerInjected = false;
  var drawerOpen = false;
  var checkoutFeedback = "";

  if (!isLocalMirror()) {
    return;
  }

  function isLocalMirror() {
    return (
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost" ||
      window.location.pathname.indexOf(BASE_PATH + "/") === 0 ||
      window.location.pathname === CART_ROOT_PATH ||
      window.location.pathname === CART_HTML_ROOT_PATH ||
      window.location.pathname.indexOf("/cart/") === 0
    );
  }

  function createEmptyState() {
    return {
      token: "local-cart-" + Math.random().toString(36).slice(2, 10),
      note: "",
      attributes: {},
      items: []
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return normalizeState(createEmptyState());
      }
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      return normalizeState(createEmptyState());
    }
  }

  function saveState(state) {
    var normalized = normalizeState(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    syncUi(normalized);
    window.dispatchEvent(new CustomEvent("local-cart:updated", { detail: clone(normalized) }));
    document.dispatchEvent(new CustomEvent("eurus:cart:items-changed", { detail: clone(normalized) }));
    return normalized;
  }

  function normalizeState(state) {
    var nextState = state || createEmptyState();
    if (!nextState.token) {
      nextState.token = createEmptyState().token;
    }
    if (!nextState.attributes || typeof nextState.attributes !== "object") {
      nextState.attributes = {};
    }
    if (!Array.isArray(nextState.items)) {
      nextState.items = [];
    }

    nextState.items = nextState.items
      .map(function (item) {
        return normalizeItem(item);
      })
      .filter(function (item) {
        return item.quantity > 0;
      });

    nextState.item_count = nextState.items.reduce(function (count, item) {
      return count + item.quantity;
    }, 0);
    nextState.total_price = nextState.items.reduce(function (total, item) {
      return total + item.final_line_price;
    }, 0);
    nextState.items_subtotal_price = nextState.total_price;
    nextState.total_discount = 0;
    nextState.total_weight = 0;
    nextState.currency = "USD";
    nextState.original_total_price = nextState.total_price;
    return nextState;
  }

  function normalizeItem(item) {
    var nextItem = item || {};
    var quantity = toPositiveInt(nextItem.quantity, 1);
    var price = toPositiveInt(nextItem.price, 0);
    var variantId = String(nextItem.id || nextItem.variant_id || "");
    var properties = normalizeProperties(nextItem.properties);
    var key = nextItem.key || buildLineKey(variantId, properties, nextItem.selling_plan);
    var title = nextItem.title || nextItem.product_title || "Blueprint product";
    var variantTitle = nextItem.variant_title || "";
    var url = normalizeMirrorUrl(nextItem.url || nextItem.product_url || "");
    var image = normalizeAssetUrl(nextItem.image || nextItem.featured_image_url || nextItem.featured_image && nextItem.featured_image.url || "");
    var imageAlt = nextItem.image_alt || nextItem.featured_image && nextItem.featured_image.alt || title;

    return {
      id: variantId,
      variant_id: variantId,
      key: key,
      quantity: quantity,
      price: price,
      final_price: price,
      line_price: price * quantity,
      final_line_price: price * quantity,
      product_title: title,
      title: title,
      variant_title: variantTitle,
      url: url,
      product_url: url,
      handle: nextItem.handle || getHandleFromUrl(url),
      image: image,
      image_alt: imageAlt,
      featured_image: {
        url: image,
        alt: imageAlt
      },
      vendor: nextItem.vendor || "Blueprint Bryan Johnson",
      sku: nextItem.sku || "",
      properties: properties,
      selling_plan: nextItem.selling_plan || null
    };
  }

  function normalizeProperties(properties) {
    if (!properties || typeof properties !== "object") {
      return {};
    }
    return Object.keys(properties).reduce(function (acc, key) {
      if (properties[key] == null || properties[key] === "") {
        return acc;
      }
      acc[key] = String(properties[key]);
      return acc;
    }, {});
  }

  function buildLineKey(variantId, properties, sellingPlan) {
    var propertyDigest = JSON.stringify(properties || {});
    return [String(variantId || ""), propertyDigest, String(sellingPlan || "")].join(":");
  }

  function toPositiveInt(value, fallback) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      return fallback;
    }
    return parsed;
  }

  function centsFromText(value) {
    var match = String(value || "").match(/([$]?)(\d[\d,]*(?:\.\d{1,2})?)/);
    if (!match) {
      return 0;
    }
    return Math.round(parseFloat(match[2].replace(/,/g, "")) * 100);
  }

  function formatMoney(cents) {
    var amount = (toPositiveInt(cents, 0) / 100).toFixed(2);
    var parts = amount.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "$" + parts.join(".");
  }

  function normalizeAssetUrl(value) {
    if (!value) {
      return BASE_PATH + "/cdn/shop/files/Logo_Blueprint_Bryan_Johnson_Stacked__q_4a911b96bf08.svg";
    }
    try {
      var url = new URL(value, window.location.href);
      var isBlueprintHost =
        url.hostname === "blueprint.bryanjohnson.com" ||
        url.hostname === "www.blueprint.bryanjohnson.com";
      if (url.pathname.indexOf(BASE_PATH + "/") === 0) {
        return url.pathname + url.search;
      }
      if (isBlueprintHost) {
        return BASE_PATH + url.pathname + url.search;
      }
      return url.pathname + url.search;
    } catch (error) {
      return value;
    }
  }

  function normalizeMirrorUrl(value) {
    if (!value || /^(#|mailto:|tel:|javascript:)/i.test(value)) {
      return value || "";
    }

    try {
      var url = new URL(value, window.location.href);
      var isBlueprintHost =
        url.hostname === "blueprint.bryanjohnson.com" ||
        url.hostname === "www.blueprint.bryanjohnson.com" ||
        url.origin === window.location.origin;
      if (!isBlueprintHost) {
        return value;
      }

      var pathname = url.pathname;
      if (pathname.indexOf(BASE_PATH + "/") === 0) {
        return pathname + url.search + url.hash;
      }
      if (pathname === "/" || pathname === "") {
        return BASE_PATH + "/index.html" + url.search + url.hash;
      }
      if (pathname === "/cart" || pathname === "/cart/") {
        return CART_PAGE_PATH + url.search + url.hash;
      }
      if (pathname === "/account" || pathname === "/account/") {
        return BASE_PATH + "/account.html" + url.search + url.hash;
      }

      var productHandle = getHandleFromUrl(pathname);
      if (productHandle) {
        return BASE_PATH + "/products/" + productHandle + ".html" + url.search + url.hash;
      }

      if (!/\.[a-z0-9]+$/i.test(pathname)) {
        return BASE_PATH + pathname + ".html" + url.search + url.hash;
      }

      return BASE_PATH + pathname + url.search + url.hash;
    } catch (error) {
      return value;
    }
  }

  function getHandleFromUrl(value) {
    var match = String(value || "").match(/\/products\/([^/?#]+)/i);
    return match ? match[1] : "";
  }

  function resolveCartPagePath() {
    return CART_PAGE_PATH;
  }

  function getCart() {
    return normalizeState(loadState());
  }

  function resetCart() {
    checkoutFeedback = "";
    return saveState(createEmptyState());
  }

  function setPendingContext(variantId, context) {
    if (!variantId || !context) {
      return;
    }
    pendingContextByVariantId[String(variantId)] = {
      context: context,
      createdAt: Date.now()
    };
  }

  function takePendingContext(variantId) {
    var key = String(variantId || "");
    var pending = pendingContextByVariantId[key];
    if (!pending) {
      return null;
    }
    if (Date.now() - pending.createdAt > 10000) {
      delete pendingContextByVariantId[key];
      return null;
    }
    delete pendingContextByVariantId[key];
    return pending.context;
  }

  function buildCardContext(button) {
    var card = button.closest(".product-card");
    var titleNode = card && card.querySelector(".product-card-title");
    var imageNode = card && card.querySelector(".product-card-image img");
    var imageLink = card && card.querySelector(".product-card-image a");
    var title = titleNode ? titleNode.textContent.trim() : "Blueprint product";
    var href =
      titleNode && titleNode.getAttribute("href") ||
      imageLink && imageLink.getAttribute("href") ||
      button.getAttribute("data-product-url") ||
      "";
    var variantId = button.getAttribute("data-variant-id") || "";
    return {
      id: variantId,
      product_title: title,
      title: title,
      variant_title: "",
      handle: getHandleFromUrl(href),
      url: normalizeMirrorUrl(href),
      image: imageNode ? normalizeAssetUrl(imageNode.getAttribute("src")) : "",
      image_alt: imageNode ? imageNode.getAttribute("alt") || title : title,
      price: centsFromText(button.textContent)
    };
  }

  function buildFormContext(form, variantId) {
    var productRoot =
      form.closest("[data-product-id]") ||
      form.closest(".shopify-section") ||
      document;
    var titleNode =
      productRoot.querySelector("h1") ||
      productRoot.querySelector("[data-sticky-atc-product-title]") ||
      document.querySelector("h1");
    var imageNode =
      productRoot.querySelector('.splide-image img[src*="/cdn/shop/files/"]') ||
      productRoot.querySelector('.image-zoom img[src*="/cdn/shop/files/"]') ||
      productRoot.querySelector('img[src*="/cdn/shop/files/"]');
    var title = titleNode ? titleNode.textContent.trim() : "Blueprint product";
    var url = normalizeMirrorUrl(window.location.pathname + window.location.search);
    return {
      id: String(variantId || ""),
      product_title: title,
      title: title,
      variant_title: "",
      handle: getHandleFromUrl(url),
      url: url,
      image: imageNode ? normalizeAssetUrl(imageNode.getAttribute("src")) : "",
      image_alt: imageNode ? imageNode.getAttribute("alt") || title : title,
      price: 0
    };
  }

  function addFormSelectionToCart(form) {
    var idInput = form && form.querySelector("input[name='id'], select[name='id']");
    if (!form || !idInput || !idInput.value) {
      return false;
    }

    var variantId = idInput.value;
    var quantityInput = form.querySelector("input[name='quantity'], select[name='quantity']");
    var formPayload = formDataToPayload(new FormData(form));
    var context = buildFormContext(form, variantId);
    setPendingContext(variantId, context);
    addItems([
      {
        id: variantId,
        quantity: quantityInput && quantityInput.value ? quantityInput.value : 1,
        properties: formPayload.properties || {},
        selling_plan: formPayload.selling_plan || null
      }
    ], {
      openDrawer: true,
      contextById: Object.assign({}, Object.create(null), (function () {
        var result = {};
        result[String(variantId)] = context;
        return result;
      })())
    });
    return true;
  }

  function getNodeText(node) {
    return String(node && node.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isQuickAddButton(button) {
    if (!button) {
      return false;
    }

    var label = getNodeText(button);
    if (!label) {
      return false;
    }

    if (label.indexOf("quick view") !== -1) {
      return false;
    }

    return label.indexOf("add to cart") !== -1 || label === "add";
  }

  function parseProductJsonLd() {
    var catalog = {};
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) {
      var payload = script.textContent && script.textContent.trim();
      if (!payload) {
        return;
      }

      var parsed;
      try {
        parsed = JSON.parse(payload);
      } catch (error) {
        return;
      }

      [].concat(parsed).forEach(function (entry) {
        registerJsonLdEntry(entry, catalog);
      });
    });
    return catalog;
  }

  function registerJsonLdEntry(entry, catalog) {
    if (!entry || typeof entry !== "object") {
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach(function (item) {
        registerJsonLdEntry(item, catalog);
      });
      return;
    }

    if (entry["@graph"]) {
      registerJsonLdEntry(entry["@graph"], catalog);
    }

    var type = entry["@type"];
    if (type === "ProductGroup" && Array.isArray(entry.hasVariant)) {
      entry.hasVariant.forEach(function (variant) {
        var variantId = getVariantIdFromEntry(variant);
        if (!variantId) {
          return;
        }
        var productTitle = entry.name || variant.name || "Blueprint product";
        var variantTitle = (variant.name || "").replace(productTitle + " - ", "");
        catalog[String(variantId)] = Object.assign({}, catalog[String(variantId)] || {}, {
          id: String(variantId),
          product_title: productTitle,
          title: productTitle,
          variant_title: variantTitle === productTitle ? "" : variantTitle,
          handle: getHandleFromUrl(variant.offers && variant.offers.url || variant["@id"] || window.location.pathname),
          url: normalizeMirrorUrl(variant.offers && variant.offers.url || variant["@id"] || window.location.pathname),
          image: normalizeAssetUrl(variant.image || ""),
          image_alt: productTitle,
          price: variant.offers && variant.offers.price ? Math.round(parseFloat(variant.offers.price) * 100) : 0
        });
      });
      return;
    }

    if (type === "Product") {
      var id = getVariantIdFromEntry(entry);
      if (!id) {
        return;
      }
      catalog[String(id)] = Object.assign({}, catalog[String(id)] || {}, {
        id: String(id),
        product_title: entry.name || "Blueprint product",
        title: entry.name || "Blueprint product",
        variant_title: "",
        handle: getHandleFromUrl(entry.offers && entry.offers.url || entry.url || window.location.pathname),
        url: normalizeMirrorUrl(entry.offers && entry.offers.url || entry.url || window.location.pathname),
        image: normalizeAssetUrl(entry.image || ""),
        image_alt: entry.name || "Blueprint product",
        price: entry.offers && entry.offers.price ? Math.round(parseFloat(entry.offers.price) * 100) : 0
      });
    }
  }

  function getVariantIdFromEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return "";
    }

    var candidates = [entry["@id"], entry.url, entry.offers && entry.offers["@id"], entry.offers && entry.offers.url];
    for (var index = 0; index < candidates.length; index += 1) {
      var value = candidates[index];
      if (!value) {
        continue;
      }
      var match = String(value).match(/[?&]variant=(\d+)/);
      if (match) {
        return match[1];
      }
    }
    return "";
  }

  function buildPageCatalog() {
    var catalog = parseProductJsonLd();

    document.querySelectorAll(".product-card-button[data-variant-id]").forEach(function (button) {
      var variantId = button.getAttribute("data-variant-id");
      if (!variantId) {
        return;
      }
      catalog[String(variantId)] = Object.assign({}, catalog[String(variantId)] || {}, buildCardContext(button));
    });

    document.querySelectorAll("form[action='/cart/add']").forEach(function (form) {
      var input = form.querySelector("input[name='id'], select[name='id']");
      if (!input || !input.value) {
        return;
      }
      catalog[String(input.value)] = Object.assign({}, catalog[String(input.value)] || {}, buildFormContext(form, input.value));
    });

    return catalog;
  }

  function resolveItemContext(variantId, explicitContext) {
    var catalog = buildPageCatalog();
    var pendingContext = takePendingContext(variantId);
    var fallbackUrl = normalizeMirrorUrl(window.location.pathname + window.location.search);
    var titleNode =
      document.querySelector("h1") ||
      document.querySelector(".product-card-title");
    var title = titleNode ? titleNode.textContent.trim() : "Blueprint product";

    return Object.assign(
      {
        id: String(variantId || ""),
        product_title: title,
        title: title,
        variant_title: "",
        handle: getHandleFromUrl(fallbackUrl),
        url: fallbackUrl,
        image: "",
        image_alt: title,
        price: 0
      },
      catalog[String(variantId)] || {},
      pendingContext || {},
      explicitContext || {}
    );
  }

  function addItems(items, options) {
    var state = getCart();
    var added = [];
    var config = options || {};

    items.forEach(function (rawItem) {
      var variantId = String(rawItem.id || rawItem.variant_id || "");
      if (!variantId) {
        return;
      }
      var quantity = Math.max(1, toPositiveInt(rawItem.quantity, 1));
      var properties = normalizeProperties(rawItem.properties);
      var context = resolveItemContext(
        variantId,
        config.contextById && config.contextById[variantId] || null
      );
      var key = buildLineKey(variantId, properties, rawItem.selling_plan);
      var existing = state.items.find(function (item) {
        return item.key === key;
      });

      if (existing) {
        existing.quantity += quantity;
        existing.line_price = existing.price * existing.quantity;
        existing.final_line_price = existing.line_price;
        existing.properties = properties;
        added.push(normalizeItem(existing));
        return;
      }

      state.items.push(normalizeItem({
        id: variantId,
        quantity: quantity,
        price: context.price,
        title: context.product_title || context.title,
        product_title: context.product_title || context.title,
        variant_title: context.variant_title || "",
        url: context.url,
        handle: context.handle,
        image: context.image,
        image_alt: context.image_alt,
        properties: properties,
        selling_plan: rawItem.selling_plan || null
      }));

      added.push(normalizeItem(state.items[state.items.length - 1]));
    });

    var saved = saveState(state);
    announce(added.length === 1 ? added[0].title + " added to cart" : "Cart updated");
    if (config.openDrawer !== false) {
      openDrawer();
    }

    if (added.length === 1) {
      return Object.assign({}, added[0], {
        items: [added[0]],
        item_count: saved.item_count
      });
    }

    return {
      items: added,
      item_count: saved.item_count
    };
  }

  function changeItemQuantity(lineKey, quantity) {
    var lookupKey = String(lineKey || "");
    var state = getCart();
    state.items = state.items.filter(function (item) {
      if (item.key !== lookupKey && item.id !== lookupKey) {
        return true;
      }
      item.quantity = Math.max(0, toPositiveInt(quantity, 0));
      item.line_price = item.price * item.quantity;
      item.final_line_price = item.line_price;
      return item.quantity > 0;
    });
    saveState(state);
  }

  function updateCartFromLinePayload(payload) {
    var state = getCart();
    if (payload.line != null) {
      var lineNumber = toPositiveInt(payload.line, 1) - 1;
      if (state.items[lineNumber]) {
        changeItemQuantity(state.items[lineNumber].key, payload.quantity);
      }
      return getCart();
    }

    if (payload.id != null) {
      changeItemQuantity(String(payload.id), payload.quantity);
      return getCart();
    }

    if (payload.updates && typeof payload.updates === "object") {
      Object.keys(payload.updates).forEach(function (key) {
        var nextQuantity = payload.updates[key];
        state.items.forEach(function (item) {
          if (item.key === key || item.id === key) {
            item.quantity = Math.max(0, toPositiveInt(nextQuantity, 0));
            item.line_price = item.price * item.quantity;
            item.final_line_price = item.line_price;
          }
        });
      });
      state.items = state.items.filter(function (item) {
        return item.quantity > 0;
      });
      return saveState(state);
    }

    if (payload.attributes && typeof payload.attributes === "object") {
      state.attributes = Object.assign({}, state.attributes, payload.attributes);
    }
    if (typeof payload.note === "string") {
      state.note = payload.note;
    }
    return saveState(state);
  }

  function parseRequestPayload(body, headers) {
    if (body == null) {
      return {};
    }

    if (body instanceof FormData) {
      return formDataToPayload(body);
    }

    if (body instanceof URLSearchParams) {
      return searchParamsToPayload(body);
    }

    if (typeof body === "string") {
      var contentType = String(headers && headers.get && headers.get("content-type") || "").toLowerCase();
      if (contentType.indexOf("application/json") !== -1) {
        try {
          return JSON.parse(body);
        } catch (error) {
          return {};
        }
      }
      return searchParamsToPayload(new URLSearchParams(body));
    }

    if (typeof body === "object") {
      return body;
    }

    return {};
  }

  function formDataToPayload(formData) {
    var payload = {};
    formData.forEach(function (value, key) {
      if (key === "properties" || key.indexOf("properties[") === 0) {
        payload.properties = payload.properties || {};
        var propertyKey = key.replace(/^properties\[?/, "").replace(/\]$/, "");
        payload.properties[propertyKey] = value;
        return;
      }

      if (key === "items" || key.indexOf("items[") === 0) {
        payload.items = payload.items || [];
      }

      if (payload[key] !== undefined) {
        if (!Array.isArray(payload[key])) {
          payload[key] = [payload[key]];
        }
        payload[key].push(value);
      } else {
        payload[key] = value;
      }
    });
    return payload;
  }

  function searchParamsToPayload(params) {
    var payload = {};
    params.forEach(function (value, key) {
      if (key === "properties" || key.indexOf("properties[") === 0) {
        payload.properties = payload.properties || {};
        var propertyKey = key.replace(/^properties\[?/, "").replace(/\]$/, "");
        payload.properties[propertyKey] = value;
        return;
      }
      payload[key] = value;
    });
    return payload;
  }

  async function getRequestBody(input, init, method) {
    if (init && init.body !== undefined) {
      return init.body;
    }
    if (!(input instanceof Request) || method === "GET" || method === "HEAD") {
      return null;
    }
    try {
      return await input.clone().formData();
    } catch (formError) {
      try {
        return await input.clone().text();
      } catch (textError) {
        return null;
      }
    }
  }

  function jsonResponse(payload) {
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  function handleCartApiRequest(pathname, method, payload) {
    if ((pathname === "/cart/add.js" || pathname === "/cart/add") && method === "POST") {
      var items = [];
      if (Array.isArray(payload.items)) {
        items = payload.items.map(function (item) {
          return {
            id: item.id || item.variant_id,
            quantity: item.quantity,
            properties: item.properties,
            selling_plan: item.selling_plan
          };
        });
      } else if (payload.id || payload.variant_id) {
        items = [
          {
            id: payload.id || payload.variant_id,
            quantity: payload.quantity,
            properties: payload.properties,
            selling_plan: payload.selling_plan
          }
        ];
      }
      return jsonResponse(addItems(items, { openDrawer: true }));
    }

    if (pathname === "/cart.js" && method === "GET") {
      return jsonResponse(getCart());
    }

    if ((pathname === "/cart/update.js" || pathname === "/cart/update") && method === "POST") {
      return jsonResponse(updateCartFromLinePayload(payload));
    }

    if (pathname === "/cart/change.js" && method === "POST") {
      return jsonResponse(updateCartFromLinePayload(payload));
    }

    if (pathname === "/cart/clear.js" && method === "POST") {
      return jsonResponse(resetCart());
    }

    return null;
  }

  function installFetchInterceptor() {
    if (window.fetch.__localCartPatched) {
      return;
    }

    var originalFetch = window.fetch.bind(window);

    var patchedFetch = async function (input, init) {
      var requestUrl = typeof input === "string" || input instanceof URL ? String(input) : input.url;
      var parsedUrl = new URL(requestUrl, window.location.origin);
      var method = String(init && init.method || input instanceof Request && input.method || "GET").toUpperCase();

      if (parsedUrl.origin === window.location.origin) {
        var body = await getRequestBody(input, init, method);
        var headers = new Headers(init && init.headers || input instanceof Request && input.headers || undefined);
        var payload = parseRequestPayload(body, headers);
        var mockedResponse = handleCartApiRequest(parsedUrl.pathname, method, payload);
        if (mockedResponse) {
          return mockedResponse;
        }
      }

      return originalFetch(input, init);
    };

    patchedFetch.__localCartPatched = true;
    window.fetch = patchedFetch;
  }

  function injectDrawer() {
    if (drawerInjected || document.getElementById(DRAWER_ROOT_ID)) {
      drawerInjected = true;
      return;
    }

    var root = document.createElement("div");
    root.id = DRAWER_ROOT_ID;
    root.className = "local-cart-drawer-root";
    root.innerHTML = [
      '<div class="local-cart-drawer-overlay" data-local-cart-close></div>',
      '<aside class="local-cart-drawer" role="dialog" aria-modal="true" aria-label="Local cart drawer">',
      '  <header class="local-cart-drawer-header">',
      '    <div class="local-cart-drawer-head">',
      '      <div>',
      '        <p class="local-cart-hero-kicker">Cart preview</p>',
      '        <h2>Mock shopping cart</h2>',
      '      </div>',
      '      <button class="local-cart-drawer-close" type="button" data-local-cart-close aria-label="Close cart">x</button>',
      "    </div>",
      '    <p class="local-cart-panel-copy">This drawer is powered entirely by local browser state.</p>',
      "  </header>",
      '  <div class="local-cart-drawer-body" data-local-cart-drawer-body></div>',
      '  <footer class="local-cart-drawer-footer" data-local-cart-drawer-footer></footer>',
      "</aside>"
    ].join("");
    document.body.appendChild(root);
    drawerInjected = true;
  }

  function ensureLiveRegion() {
    if (document.getElementById(LIVE_REGION_ID)) {
      return;
    }
    var region = document.createElement("div");
    region.id = LIVE_REGION_ID;
    region.className = "local-cart-live-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    document.body.appendChild(region);
  }

  function announce(message) {
    var region = document.getElementById(LIVE_REGION_ID);
    if (!region) {
      return;
    }
    region.textContent = "";
    window.setTimeout(function () {
      region.textContent = message;
    }, 10);
  }

  function openDrawer() {
    injectDrawer();
    drawerOpen = true;
    document.body.classList.add(OPEN_CLASS);
    var root = document.getElementById(DRAWER_ROOT_ID);
    if (root) {
      root.classList.add("is-open");
    }
    var cartIcon = document.getElementById("cart-icon-bubble");
    if (cartIcon) {
      cartIcon.setAttribute("aria-expanded", "true");
    }
    syncUi(getCart());
  }

  function closeDrawer() {
    drawerOpen = false;
    document.body.classList.remove(OPEN_CLASS);
    var root = document.getElementById(DRAWER_ROOT_ID);
    if (root) {
      root.classList.remove("is-open");
    }
    var cartIcon = document.getElementById("cart-icon-bubble");
    if (cartIcon) {
      cartIcon.setAttribute("aria-expanded", "false");
    }
  }

  function renderEmptyState() {
    return [
      '<section class="local-cart-surface local-cart-empty">',
      "  <div>",
      "    <p class=\"local-cart-hero-kicker\">Empty cart</p>",
      "    <h2>Your local cart is ready for experiments.</h2>",
      "    <p>Add products from the mirrored storefront to preview cart counts, line items, quantity controls, and mock checkout messaging without touching Shopify.</p>",
      "  </div>",
      '  <div class="local-cart-empty-actions">',
      '    <a class="local-cart-button" href="/blueprint.bryanjohnson.com/collections/all-products.html">Browse products</a>',
      '    <a class="local-cart-link-button" href="/blueprint.bryanjohnson.com/index.html">Back home</a>',
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderItems(items) {
    return items.map(function (item) {
      var variant = item.variant_title
        ? '<span class="local-cart-item-variant">' + escapeHtml(item.variant_title) + "</span>"
        : "";
      return [
        '<article class="local-cart-item" data-line-key="' + escapeHtml(item.key) + '">',
        '  <a class="local-cart-item-media" href="' + escapeHtml(item.url || resolveCartPagePath()) + '">',
        '    <img src="' + escapeHtml(item.image || "") + '" alt="' + escapeHtml(item.image_alt || item.title) + '">',
        "  </a>",
        '  <div class="local-cart-item-body">',
        '    <div class="local-cart-item-head">',
        "      <div>",
        '        <a href="' + escapeHtml(item.url || resolveCartPagePath()) + '"><h3 class="local-cart-item-title">' + escapeHtml(item.title) + "</h3></a>",
        "        " + variant,
        "      </div>",
        '      <strong>' + escapeHtml(formatMoney(item.final_line_price)) + "</strong>",
        "    </div>",
        '    <div class="local-cart-item-controls">',
        '      <div class="local-cart-qty-group" aria-label="Quantity controls">',
        '        <button class="local-cart-qty-button" type="button" data-cart-action="decrease" data-line-key="' + escapeHtml(item.key) + '" aria-label="Decrease quantity">-</button>',
        '        <span class="local-cart-qty-value">' + escapeHtml(item.quantity) + "</span>",
        '        <button class="local-cart-qty-button" type="button" data-cart-action="increase" data-line-key="' + escapeHtml(item.key) + '" aria-label="Increase quantity">+</button>',
        "      </div>",
        '      <div class="local-cart-meta">',
        '        <span class="local-cart-line-price">' + escapeHtml(formatMoney(item.price)) + " each</span>",
        '        <button class="local-cart-remove-button" type="button" data-cart-action="remove" data-line-key="' + escapeHtml(item.key) + '">Remove</button>',
        "      </div>",
        "    </div>",
        "  </div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderSummary(cart) {
    var itemLabel = cart.item_count === 1 ? "item" : "items";
    var feedback = checkoutFeedback
      ? '<p class="local-cart-feedback" data-tone="warning">' + escapeHtml(checkoutFeedback) + "</p>"
      : '<p class="local-cart-feedback"></p>';
    return [
      '<section class="local-cart-summary">',
      '  <article class="local-cart-surface local-cart-summary-card">',
      "    <h2>Summary</h2>",
      '    <p class="local-cart-summary-note">This mock tracks quantities, totals, and cart navigation locally so you can iterate on cart UI without checkout infrastructure.</p>',
      '    <div class="local-cart-summary-row"><span>Items</span><strong>' + escapeHtml(cart.item_count) + " " + itemLabel + "</strong></div>",
      '    <div class="local-cart-summary-row"><span>Shipping</span><span>Calculated at mock checkout</span></div>',
      '    <div class="local-cart-summary-total"><span>Subtotal</span><strong>' + escapeHtml(formatMoney(cart.total_price)) + "</strong></div>",
      "    " + feedback,
      '    <div class="local-cart-summary-actions">',
      '      <button class="local-cart-button" type="button" data-cart-action="checkout">Proceed to mock checkout</button>',
      '      <button class="local-cart-ghost-button" type="button" data-cart-action="clear">Clear cart</button>',
      "    </div>",
      "  </article>",
      '  <article class="local-cart-surface local-cart-summary-card">',
      "    <h3>Cart backend status</h3>",
      '    <div class="local-cart-chip">Active local mock</div>',
      '    <p class="local-cart-summary-note">Supported: add to cart, quantity updates, remove, clear, cart route, and cart count sync.</p>',
      '    <p class="local-cart-summary-note">Still mocked: checkout, taxes, shipping rates, discounts, customer-specific pricing, and real order creation.</p>',
      "  </article>",
      "</section>"
    ].join("");
  }

  function renderPage(cart) {
    var root = document.querySelector("[data-local-cart-page]");
    if (!root) {
      return;
    }

    if (!cart.items.length) {
      root.innerHTML = renderEmptyState();
      return;
    }

    root.innerHTML = [
      '<section class="local-cart-page-grid">',
      '  <article class="local-cart-surface local-cart-panel">',
      '    <div class="local-cart-page-actions">',
      '      <span class="local-cart-chip">' + escapeHtml(cart.item_count) + " item" + (cart.item_count === 1 ? "" : "s") + "</span>",
      '      <a class="local-cart-link-button" href="/blueprint.bryanjohnson.com/collections/all-products.html">Continue shopping</a>',
      "    </div>",
      '    <div class="local-cart-item-list">' + renderItems(cart.items) + "</div>",
      "  </article>",
      renderSummary(cart),
      "</section>"
    ].join("");
  }

  function renderDrawer(cart) {
    injectDrawer();
    var body = document.querySelector("[data-local-cart-drawer-body]");
    var footer = document.querySelector("[data-local-cart-drawer-footer]");
    if (!body || !footer) {
      return;
    }

    if (!cart.items.length) {
      body.innerHTML = renderEmptyState();
      footer.innerHTML = [
        '<div class="local-cart-drawer-actions">',
        '  <a class="local-cart-button" href="/blueprint.bryanjohnson.com/collections/all-products.html">Browse products</a>',
        '  <button class="local-cart-ghost-button" type="button" data-local-cart-close>Close</button>',
        "</div>"
      ].join("");
      return;
    }

    body.innerHTML = renderItems(cart.items);
    footer.innerHTML = [
      '<div class="local-cart-summary-total"><span>Subtotal</span><strong>' + escapeHtml(formatMoney(cart.total_price)) + "</strong></div>",
      '<div class="local-cart-drawer-actions">',
      '  <a class="local-cart-button" href="' + escapeHtml(resolveCartPagePath()) + '">View full cart</a>',
      '  <button class="local-cart-ghost-button" type="button" data-cart-action="checkout">Mock checkout</button>',
      "  <button class=\"local-cart-ghost-button\" type=\"button\" data-local-cart-close>Close</button>",
      "</div>"
    ].join("");
  }

  function syncHeaderCount(cart) {
    document.querySelectorAll("[data-header-cart-count]").forEach(function (node) {
      node.textContent = String(cart.item_count);
      if (cart.item_count > 0) {
        node.classList.remove("hide-if-empty-cart");
      } else {
        node.classList.add("hide-if-empty-cart");
      }
    });
  }

  function syncUi(cart) {
    syncHeaderCount(cart);
    renderPage(cart);
    renderDrawer(cart);
    patchAlpineStores(cart);
  }

  function patchAlpineStores(cart) {
    if (!window.Alpine || typeof window.Alpine.store !== "function") {
      return;
    }

    var miniCart = null;
    try {
      miniCart = window.Alpine.store("xMiniCart");
    } catch (error) {
      miniCart = null;
    }

    if (!miniCart) {
      try {
        window.Alpine.store("xMiniCart", {
          open: drawerOpen,
          needReload: false,
          loading: false,
          openCart: function () {
            openDrawer();
            this.open = true;
          },
          hideCart: function () {
            closeDrawer();
            this.open = false;
          },
          reLoad: function () {
            syncUi(getCart());
          }
        });
      } catch (error) {
        miniCart = null;
      }
    } else {
      miniCart.open = drawerOpen;
      miniCart.needReload = false;
      miniCart.loading = false;
      miniCart.openCart = function () {
        openDrawer();
        miniCart.open = true;
      };
      miniCart.hideCart = function () {
        closeDrawer();
        miniCart.open = false;
      };
      miniCart.reLoad = function () {
        syncUi(getCart());
      };
    }

    var helperStore = null;
    try {
      helperStore = window.Alpine.store("xCartHelper");
    } catch (error) {
      helperStore = null;
    }

    if (helperStore) {
      helperStore.currentItemCount = cart.item_count;
      helperStore.getSectionsToRender = helperStore.getSectionsToRender || function () {
        return [];
      };
      helperStore.waitForEstimateUpdate = helperStore.waitForEstimateUpdate || function () {
        return Promise.resolve();
      };
    }

    var cartNoti = null;
    try {
      cartNoti = window.Alpine.store("xCartNoti");
    } catch (error) {
      cartNoti = null;
    }

    if (cartNoti) {
      cartNoti.enable = false;
    }
  }

  function patchQuickViewStore() {
    if (!window.Alpine || typeof window.Alpine.store !== "function") {
      return false;
    }

    var quickView = null;
    try {
      quickView = window.Alpine.store("xQuickView");
    } catch (error) {
      quickView = null;
    }

    if (!quickView || typeof quickView.open !== "function") {
      return false;
    }

    if (quickView.__localCartPatched) {
      return true;
    }

    var lastTrigger = null;
    var originalOpen = quickView.open.bind(quickView);
    var originalLoad = typeof quickView.load === "function" ? quickView.load.bind(quickView) : null;

    if (originalLoad) {
      quickView.load = function () {
        lastTrigger = arguments.length > 1 ? arguments[1] : null;
        return originalLoad.apply(this, arguments);
      };
    }

    quickView.open = function () {
      var triggerElement = lastTrigger;
      var triggerButton = triggerElement && triggerElement.closest ? triggerElement.closest("button") : null;
      var triggerForm = triggerElement && triggerElement.closest
        ? triggerElement.closest("form[data-type='add-to-cart-form'], form[action='/cart/add']")
        : null;

      if (triggerButton && triggerForm && isQuickAddButton(triggerButton)) {
        if (addFormSelectionToCart(triggerForm)) {
          if (quickView.show) {
            quickView.show = false;
          }
          if (quickView.openPopupMobile) {
            quickView.openPopupMobile = false;
          }
          return;
        }
      }

      return originalOpen.apply(this, arguments);
    };

    quickView.__localCartPatched = true;
    return true;
  }

  function handleCheckout() {
    checkoutFeedback = "Checkout is intentionally disabled in this local mirror. You can still test cart UX, counts, and line-item behavior.";
    syncUi(getCart());
  }

  function bindDocumentEvents() {
    document.addEventListener(
      "click",
      function (event) {
        var cartTrigger = event.target.closest("#cart-icon-bubble, [data-local-cart-open]");
        if (cartTrigger) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
          openDrawer();
          return;
        }

        var closeTrigger = event.target.closest("[data-local-cart-close]");
        if (closeTrigger) {
          event.preventDefault();
          closeDrawer();
          return;
        }

        var formQuickAddButton = event.target.closest("button");
        if (formQuickAddButton && isQuickAddButton(formQuickAddButton)) {
          var quickAddForm = formQuickAddButton.closest("form[data-type='add-to-cart-form'], form[action='/cart/add']");
          if (quickAddForm) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") {
              event.stopImmediatePropagation();
            }

            if (addFormSelectionToCart(quickAddForm)) {
              return;
            }
          }
        }

        var cardButton = event.target.closest(".product-card-button[data-variant-id]");
        if (cardButton) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }

          var variantId = cardButton.getAttribute("data-variant-id");
          var context = buildCardContext(cardButton);
          setPendingContext(variantId, context);
          addItems([{ id: variantId, quantity: 1 }], {
            openDrawer: true,
            contextById: Object.assign({}, Object.create(null), (function () {
              var result = {};
              result[String(variantId)] = context;
              return result;
            })())
          });
          return;
        }

        var anyVariantTrigger = event.target.closest("[data-variant-id]");
        if (anyVariantTrigger) {
          setPendingContext(anyVariantTrigger.getAttribute("data-variant-id"), buildCardContext(anyVariantTrigger));
        }

        var actionButton = event.target.closest("[data-cart-action]");
        if (!actionButton) {
          return;
        }

        var action = actionButton.getAttribute("data-cart-action");
        var lineKey = actionButton.getAttribute("data-line-key");
        var cart = getCart();
        var item = cart.items.find(function (candidate) {
          return candidate.key === lineKey;
        });

        if (action === "increase" && item) {
          changeItemQuantity(lineKey, item.quantity + 1);
          return;
        }
        if (action === "decrease" && item) {
          changeItemQuantity(lineKey, Math.max(0, item.quantity - 1));
          return;
        }
        if (action === "remove" && item) {
          changeItemQuantity(lineKey, 0);
          return;
        }
        if (action === "clear") {
          resetCart();
          return;
        }
        if (action === "checkout") {
          handleCheckout();
        }
      },
      true
    );

    document.addEventListener(
      "submit",
      function (event) {
        var form = event.target;
        if (!form || !form.matches || !form.matches("form[action='/cart/add']")) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }

        var formData = new FormData(form);
        if (!formData.get("id")) {
          return;
        }
        addFormSelectionToCart(form);
      },
      true
    );

    document.addEventListener("rebuy:smartcart.show", function () {
      openDrawer();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawerOpen) {
        closeDrawer();
      }
    });

    window.addEventListener("popstate", function () {
      syncUi(getCart());
    });

    window.addEventListener("local-cart:updated", function (event) {
      patchAlpineStores(event.detail || getCart());
    });
  }

  function installRebuyBridge() {
    var rebuy = window.Rebuy || {};
    rebuy.SmartCart = rebuy.SmartCart || {};
    rebuy.SmartCart.show = openDrawer;
    rebuy.SmartCart.hide = closeDrawer;
    window.Rebuy = rebuy;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function init() {
    ensureLiveRegion();
    injectDrawer();
    installFetchInterceptor();
    installRebuyBridge();
    bindDocumentEvents();
    syncUi(getCart());

    document.addEventListener("alpine:initialized", function () {
      patchAlpineStores(getCart());
      patchQuickViewStore();
    });
    window.setTimeout(function () {
      patchAlpineStores(getCart());
      patchQuickViewStore();
      installRebuyBridge();
    }, 250);
    patchQuickViewStore();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.BlueprintLocalCartMock = {
    getCart: getCart,
    resetCart: resetCart,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    addItems: addItems
  };
})();
