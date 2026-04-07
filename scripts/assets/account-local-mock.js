(function () {
  var STORAGE_KEY = "blueprint-local-account-mock";
  var ACCOUNT_BASE_PATH = "/blueprint.bryanjohnson.com/account.html";
  var VIEW_PATHS = {
    overview: ACCOUNT_BASE_PATH,
    login: "/blueprint.bryanjohnson.com/account/login.html",
    register: "/blueprint.bryanjohnson.com/account/register.html",
    recover: "/blueprint.bryanjohnson.com/account/recover.html",
    addresses: "/blueprint.bryanjohnson.com/account/addresses.html",
    orders: ACCOUNT_BASE_PATH + "?view=orders",
    subscriptions: ACCOUNT_BASE_PATH + "?view=subscriptions",
    profile: ACCOUNT_BASE_PATH + "?view=profile"
  };
  var MOCK_STATE_TEMPLATE = {
    signedIn: false,
    profile: {
      firstName: "Bryan",
      lastName: "Explorer",
      email: "bryan@example.com",
      tier: "Founding Subscriber",
      since: "January 2026",
      newsletter: true
    },
    orders: [
      {
        id: "BP-1047",
        placedOn: "March 28, 2026",
        total: "$147.00",
        status: "Delivered",
        items: ["Essential Capsules", "Extra Virgin Olive Oil", "Creatine"]
      },
      {
        id: "BP-1019",
        placedOn: "February 18, 2026",
        total: "$98.00",
        status: "Shipped",
        items: ["Easy Stack"]
      }
    ],
    subscriptions: [
      {
        title: "Essential Capsules",
        cadence: "Every 30 days",
        nextShip: "April 18, 2026",
        status: "Active"
      },
      {
        title: "Longevity Mix - Blood Orange",
        cadence: "Every 45 days",
        nextShip: "May 2, 2026",
        status: "Paused"
      }
    ],
    addresses: [
      {
        label: "Primary Shipping",
        lines: ["Bryan Explorer", "123 Vitality Ave", "Venice, CA 90291", "United States"],
        defaultAddress: true
      },
      {
        label: "Recovery Studio",
        lines: ["Bryan Explorer", "44 Routine Loop", "Austin, TX 78701", "United States"],
        defaultAddress: false
      }
    ]
  };

  function cloneTemplateState() {
    return JSON.parse(JSON.stringify(MOCK_STATE_TEMPLATE));
  }

  function loadState() {
    try {
      var rawState = window.localStorage.getItem(STORAGE_KEY);
      if (!rawState) {
        return cloneTemplateState();
      }

      return Object.assign(cloneTemplateState(), JSON.parse(rawState));
    } catch (error) {
      return cloneTemplateState();
    }
  }

  function saveState(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState() {
    window.localStorage.removeItem(STORAGE_KEY);
    return cloneTemplateState();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function determineView() {
    var path = window.location.pathname || "";
    var params = new URL(window.location.href).searchParams;
    var queryView = params.get("view");
    if (queryView && VIEW_PATHS[queryView]) {
      return queryView;
    }
    if (path.indexOf("/account/login") !== -1) {
      return "login";
    }
    if (path.indexOf("/account/register") !== -1) {
      return "register";
    }
    if (path.indexOf("/account/recover") !== -1) {
      return "recover";
    }
    if (path.indexOf("/account/addresses") !== -1) {
      return "addresses";
    }
    return "overview";
  }

  function navigateTo(view, replaceState) {
    var nextUrl = VIEW_PATHS[view] || VIEW_PATHS.overview;
    if (replaceState) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }
  }

  function getDisplayView(state, view) {
    if (state.signedIn) {
      if (view === "login" || view === "register" || view === "recover") {
        return "overview";
      }
      return view;
    }

    if (view === "register" || view === "recover") {
      return view;
    }

    return "login";
  }

  function renderSidebar(state, activeView) {
    var sessionTitle = document.getElementById("mock-session-title");
    var sessionCopy = document.getElementById("mock-session-copy");
    var sessionChip = document.getElementById("mock-session-chip");
    var nav = document.getElementById("mock-side-links");
    var sideReset = document.getElementById("mock-reset-button");
    var sideSignOut = document.getElementById("mock-signout-button");
    var memberSince = document.getElementById("mock-member-since");
    var statusCopy = state.signedIn
      ? "Stored locally in this browser. No Shopify auth or backend requests are involved."
      : "Mock mode is active. Sign in locally to preview account-only UI states.";

    sessionTitle.textContent = state.signedIn
      ? state.profile.firstName + " " + state.profile.lastName
      : "Guest session";
    sessionCopy.textContent = statusCopy;
    sessionChip.textContent = state.signedIn ? "Signed in" : "Signed out";
    sessionChip.setAttribute("data-session", state.signedIn ? "signed-in" : "signed-out");
    memberSince.textContent = state.signedIn
      ? "Subscriber since " + state.profile.since
      : "Create a local mock account to preview orders, subscriptions, and profile screens.";

    nav.innerHTML = [
      buildNavLink("overview", "Overview", activeView),
      buildNavLink("orders", "Orders", activeView),
      buildNavLink("subscriptions", "Subscriptions", activeView),
      buildNavLink("profile", "Profile", activeView),
      buildNavLink("addresses", "Addresses", activeView)
    ].join("");

    sideReset.onclick = function () {
      state = resetState();
      saveState(state);
      render(state, determineView());
    };

    if (state.signedIn) {
      sideSignOut.hidden = false;
      sideSignOut.onclick = function () {
        state.signedIn = false;
        saveState(state);
        navigateTo("login", true);
        render(state, "login");
      };
    } else {
      sideSignOut.hidden = true;
      sideSignOut.onclick = null;
    }
  }

  function buildNavLink(view, label, activeView) {
    var href = VIEW_PATHS[view];
    var current = activeView === view ? ' aria-current="page"' : "";
    return '<a href="' + href + '"' + current + '><span>' + label + '</span><span>&rsaquo;</span></a>';
  }

  function renderHero(state, activeView) {
    var heroTitle = document.getElementById("mock-hero-title");
    var heroSubtitle = document.getElementById("mock-hero-subtitle");
    var heroPills = document.getElementById("mock-hero-pills");

    var titles = {
      overview: "Local account sandbox",
      login: "Mock customer login",
      register: "Create a local account preview",
      recover: "Password recovery preview",
      orders: "Recent orders",
      subscriptions: "Routine subscriptions",
      profile: "Profile settings",
      addresses: "Saved addresses"
    };

    var subtitles = {
      overview: "Preview account-only states without talking to Shopify. Everything on this screen is stored in localStorage so you can iterate on UI safely.",
      login: "Use any email and name combination below to simulate a signed-in customer and unlock the account dashboard.",
      register: "Mock the sign-up flow locally to test onboarding copy, validation states, and post-auth layouts.",
      recover: "This mirrors the forgot-password UX locally. Submit an email and the page will confirm a fake recovery message.",
      orders: "Use these seeded orders to experiment with fulfillment badges, order cards, and status presentation.",
      subscriptions: "This view mocks a customer routine dashboard with active and paused recurring shipments.",
      profile: "Update customer-facing profile controls locally without needing a real customer record.",
      addresses: "Exercise account address layouts and edit actions with fake but persistent data."
    };

    heroTitle.textContent = titles[activeView] || titles.overview;
    heroSubtitle.textContent = subtitles[activeView] || subtitles.overview;

    heroPills.innerHTML = [
      '<span class="local-account-pill">Backend: local mock</span>',
      '<span class="local-account-pill">Session: ' + (state.signedIn ? "signed in" : "signed out") + "</span>",
      '<span class="local-account-pill">State store: localStorage</span>'
    ].join("");
  }

  function renderContent(state, activeView) {
    var content = document.getElementById("mock-content");
    var displayView = getDisplayView(state, activeView);

    if (!state.signedIn && displayView === "login") {
      content.innerHTML = renderLoginView();
      bindLoginForm(state);
      return;
    }

    if (!state.signedIn && displayView === "register") {
      content.innerHTML = renderRegisterView();
      bindRegisterForm(state);
      return;
    }

    if (!state.signedIn && displayView === "recover") {
      content.innerHTML = renderRecoverView();
      bindRecoverForm();
      return;
    }

    if (!state.signedIn) {
      content.innerHTML = renderSignedOutGate();
      bindCtaButtons(state);
      return;
    }

    if (displayView === "orders") {
      content.innerHTML = renderOrdersView(state);
      return;
    }

    if (displayView === "subscriptions") {
      content.innerHTML = renderSubscriptionsView(state);
      return;
    }

    if (displayView === "profile") {
      content.innerHTML = renderProfileView(state);
      bindProfileForm(state);
      return;
    }

    if (displayView === "addresses") {
      content.innerHTML = renderAddressesView(state);
      bindAddressButtons(state);
      return;
    }

    content.innerHTML = renderOverviewView(state);
  }

  function renderOverviewView(state) {
    return [
      '<section class="local-account-content-card local-account-card">',
      '<h2>Welcome back, ' + escapeHtml(state.profile.firstName) + '.</h2>',
      '<p class="local-account-note">This dashboard is a local stand-in for Shopify customer data. Use it to prototype authenticated account UI without waiting on a real backend.</p>',
      '<div class="local-account-content-grid">',
      renderMetric("Mock tier", escapeHtml(state.profile.tier), "Try alternate loyalty or membership treatments safely."),
      renderMetric("Open subscriptions", String(state.subscriptions.length), "Useful for testing routine-focused account states."),
      renderMetric("Recent orders", String(state.orders.length), "Seeded order history helps with card and table design."),
      renderMetric("Saved addresses", String(state.addresses.length), "Exercise address selectors and management flows."),
      "</div>",
      '<div class="local-account-callout">Need richer scenarios? Edit the seeded mock data in this page or wire your own local fixtures into the browser state.</div>',
      "</section>",
      '<section class="local-account-content-card local-account-card">',
      "<h2>What is mocked right now</h2>",
      '<div class="local-account-list">',
      renderSimpleItem("Orders", "Two seeded orders with statuses, totals, and line items."),
      renderSimpleItem("Subscriptions", "One active and one paused shipment cadence to test different states."),
      renderSimpleItem("Profile", "Editable customer name, email, newsletter preference, and member tier."),
      "</div>",
      "</section>"
    ].join("");
  }

  function renderOrdersView(state) {
    return [
      '<section class="local-account-content-card local-account-card">',
      "<h2>Orders</h2>",
      '<p class="local-account-note">These are seeded locally. Refreshes persist because the mock account lives in localStorage.</p>',
      '<div class="local-account-list">',
      state.orders.map(function (order) {
        return [
          '<article class="local-account-list-item">',
          '<div class="local-account-list-top">',
          "<div>",
          '<h3 class="local-account-item-title">Order ' + escapeHtml(order.id) + "</h3>",
          '<p class="local-account-item-meta">Placed ' + escapeHtml(order.placedOn) + " &middot; " + escapeHtml(order.total) + "</p>",
          "</div>",
          '<span class="local-account-status-chip" data-status="' + (order.status === "Delivered" ? "active" : "paused") + '">' + escapeHtml(order.status) + "</span>",
          "</div>",
          '<div class="local-account-tag-row">',
          order.items.map(function (item) {
            return '<span class="local-account-tag">' + escapeHtml(item) + "</span>";
          }).join(""),
          "</div>",
          '<div class="local-account-inline-actions">',
          '<a class="local-account-link-button" href="/blueprint.bryanjohnson.com/collections/all-products.html">Shop similar items</a>',
          '<button class="local-account-ghost-button" type="button">Download invoice</button>',
          "</div>",
          "</article>"
        ].join("");
      }).join(""),
      "</div>",
      "</section>"
    ].join("");
  }

  function renderSubscriptionsView(state) {
    return [
      '<section class="local-account-content-card local-account-card">',
      "<h2>Subscriptions</h2>",
      '<p class="local-account-note">Use this view to tune recurring-order badges, next shipment summaries, and pause/resume controls.</p>',
      '<div class="local-account-list">',
      state.subscriptions.map(function (subscription, index) {
        var statusType = subscription.status === "Active" ? "active" : "paused";
        return [
          '<article class="local-account-list-item">',
          '<div class="local-account-list-top">',
          "<div>",
          '<h3 class="local-account-item-title">' + escapeHtml(subscription.title) + "</h3>",
          '<p class="local-account-item-meta">' + escapeHtml(subscription.cadence) + " &middot; Next ship " + escapeHtml(subscription.nextShip) + "</p>",
          "</div>",
          '<span class="local-account-status-chip" data-status="' + statusType + '">' + escapeHtml(subscription.status) + "</span>",
          "</div>",
          '<div class="local-account-inline-actions">',
          '<button class="local-account-secondary-button" type="button" data-subscription-toggle="' + index + '">' + (subscription.status === "Active" ? "Pause shipment" : "Resume shipment") + "</button>",
          '<a class="local-account-link-button" href="/blueprint.bryanjohnson.com/products/essentials-capsules.html">View product</a>',
          "</div>",
          "</article>"
        ].join("");
      }).join(""),
      "</div>",
      "</section>"
    ].join("");
  }

  function renderProfileView(state) {
    return [
      '<section class="local-account-content-card local-account-card">',
      "<h2>Profile</h2>",
      '<p class="local-account-note">Update customer-facing fields locally to test profile editing UI and success states.</p>',
      '<form id="mock-profile-form" class="local-account-form">',
      '<div class="local-account-form-row">',
      '<label>First name<input name="firstName" value="' + escapeHtml(state.profile.firstName) + '" required></label>',
      '<label>Last name<input name="lastName" value="' + escapeHtml(state.profile.lastName) + '" required></label>',
      "</div>",
      '<div class="local-account-form-row">',
      '<label>Email<input name="email" type="email" value="' + escapeHtml(state.profile.email) + '" required></label>',
      '<label>Member tier<input name="tier" value="' + escapeHtml(state.profile.tier) + '"></label>',
      "</div>",
      '<label class="checkbox-row"><input name="newsletter" type="checkbox"' + (state.profile.newsletter ? " checked" : "") + '> Receive product and routine updates</label>',
      '<div class="local-account-inline-actions">',
      '<button class="local-account-primary-button" type="submit">Save mock profile</button>',
      '<button class="local-account-ghost-button" type="button" id="mock-profile-reset">Restore defaults</button>',
      "</div>",
      '<div class="local-account-callout" id="mock-profile-message" hidden>Saved locally. This does not call Shopify.</div>',
      "</form>",
      "</section>"
    ].join("");
  }

  function renderAddressesView(state) {
    return [
      '<section class="local-account-content-card local-account-card">',
      "<h2>Addresses</h2>",
      '<p class="local-account-note">These cards are fully local. You can toggle the default address to exercise address management states.</p>',
      '<div class="local-account-list">',
      state.addresses.map(function (address, index) {
        return [
          '<article class="local-account-list-item">',
          '<div class="local-account-list-top">',
          "<div>",
          '<h3 class="local-account-item-title">' + escapeHtml(address.label) + "</h3>",
          '<p class="local-account-item-meta">' + address.lines.map(escapeHtml).join("<br>") + "</p>",
          "</div>",
          address.defaultAddress
            ? '<span class="local-account-status-chip" data-status="active">Default</span>'
            : '<span class="local-account-status-chip" data-status="paused">Secondary</span>',
          "</div>",
          '<div class="local-account-inline-actions">',
          '<button class="local-account-secondary-button" type="button" data-address-default="' + index + '">' + (address.defaultAddress ? "Default address" : "Set as default") + "</button>",
          '<button class="local-account-ghost-button" type="button">Edit layout</button>',
          "</div>",
          "</article>"
        ].join("");
      }).join(""),
      "</div>",
      "</section>"
    ].join("");
  }

  function renderLoginView() {
    return [
      '<section class="local-account-content-card local-account-card">',
      "<h2>Sign in</h2>",
      '<p class="local-account-note">Enter any email and name. The mock session is stored locally in this browser only.</p>',
      '<form id="mock-login-form" class="local-account-form">',
      '<label>Email<input name="email" type="email" placeholder="you@example.com" required></label>',
      '<div class="local-account-form-row">',
      '<label>First name<input name="firstName" placeholder="Bryan" required></label>',
      '<label>Last name<input name="lastName" placeholder="Explorer" required></label>',
      "</div>",
      '<div class="local-account-inline-actions">',
      '<button class="local-account-primary-button" type="submit">Enter mock account</button>',
      '<a class="local-account-link-button" href="' + VIEW_PATHS.register + '">Create account</a>',
      '<a class="local-account-link-button" href="' + VIEW_PATHS.recover + '">Forgot password</a>',
      "</div>",
      '<div class="local-account-callout">Tip: this is useful for iterating on customer-only navigation, orders, and routine management UI without any real auth dependency.</div>',
      "</form>",
      "</section>"
    ].join("");
  }

  function renderRegisterView() {
    return [
      '<section class="local-account-content-card local-account-card">',
      "<h2>Create mock account</h2>",
      '<p class="local-account-note">This simulates the first-run customer onboarding flow locally.</p>',
      '<form id="mock-register-form" class="local-account-form">',
      '<div class="local-account-form-row">',
      '<label>First name<input name="firstName" placeholder="Bryan" required></label>',
      '<label>Last name<input name="lastName" placeholder="Explorer" required></label>',
      "</div>",
      '<label>Email<input name="email" type="email" placeholder="you@example.com" required></label>',
      '<label class="checkbox-row"><input name="newsletter" type="checkbox" checked> Start with product and routine emails enabled</label>',
      '<div class="local-account-inline-actions">',
      '<button class="local-account-primary-button" type="submit">Create local profile</button>',
      '<a class="local-account-link-button" href="' + VIEW_PATHS.login + '">Already have an account?</a>',
      "</div>",
      "</form>",
      "</section>"
    ].join("");
  }

  function renderRecoverView() {
    return [
      '<section class="local-account-content-card local-account-card">',
      "<h2>Password recovery</h2>",
      '<p class="local-account-note">This preview confirms a fake reset flow so you can style the state without a backend.</p>',
      '<form id="mock-recover-form" class="local-account-form">',
      '<label>Email<input name="email" type="email" placeholder="you@example.com" required></label>',
      '<div class="local-account-inline-actions">',
      '<button class="local-account-primary-button" type="submit">Send mock reset link</button>',
      '<a class="local-account-link-button" href="' + VIEW_PATHS.login + '">Back to sign in</a>',
      "</div>",
      '<div class="local-account-callout" id="mock-recover-message" hidden>A mock reset link has been queued locally. No email was sent.</div>',
      "</form>",
      "</section>"
    ].join("");
  }

  function renderSignedOutGate() {
    return [
      '<section class="local-account-content-card local-account-card local-account-empty">',
      "<h2>Sign in to preview this account state</h2>",
      "<p>The live storefront would require a Shopify customer session here. In the mirror, we gate it behind a local mock login so you can keep designing against realistic authenticated layouts.</p>",
      '<div class="local-account-inline-actions" style="justify-content:center; margin-top:20px;">',
      '<a class="local-account-primary-button" href="' + VIEW_PATHS.login + '">Go to mock sign in</a>',
      '<a class="local-account-link-button" href="' + VIEW_PATHS.register + '">Create a mock account</a>',
      "</div>",
      "</section>"
    ].join("");
  }

  function renderMetric(label, value, copy) {
    return [
      '<div class="local-account-metric">',
      '<span class="local-account-metric-label">' + label + "</span>",
      '<span class="local-account-metric-value">' + value + "</span>",
      '<p class="local-account-metric-copy">' + copy + "</p>",
      "</div>"
    ].join("");
  }

  function renderSimpleItem(title, copy) {
    return [
      '<article class="local-account-list-item">',
      '<h3 class="local-account-item-title">' + title + "</h3>",
      '<p class="local-account-item-meta">' + copy + "</p>",
      "</article>"
    ].join("");
  }

  function bindLoginForm(state) {
    var form = document.getElementById("mock-login-form");
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      state.signedIn = true;
      state.profile.email = String(formData.get("email") || "");
      state.profile.firstName = String(formData.get("firstName") || "");
      state.profile.lastName = String(formData.get("lastName") || "");
      saveState(state);
      navigateTo("overview", true);
      render(state, "overview");
    });
  }

  function bindRegisterForm(state) {
    var form = document.getElementById("mock-register-form");
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      state.signedIn = true;
      state.profile.firstName = String(formData.get("firstName") || "");
      state.profile.lastName = String(formData.get("lastName") || "");
      state.profile.email = String(formData.get("email") || "");
      state.profile.newsletter = formData.get("newsletter") === "on";
      saveState(state);
      navigateTo("overview", true);
      render(state, "overview");
    });
  }

  function bindRecoverForm() {
    var form = document.getElementById("mock-recover-form");
    var message = document.getElementById("mock-recover-message");
    if (!form || !message) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      message.hidden = false;
    });
  }

  function bindCtaButtons(state) {
    var links = document.querySelectorAll("[href]");
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        saveState(state);
      });
    });
  }

  function bindProfileForm(state) {
    var form = document.getElementById("mock-profile-form");
    var message = document.getElementById("mock-profile-message");
    var resetButton = document.getElementById("mock-profile-reset");
    if (!form || !message || !resetButton) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      state.profile.firstName = String(formData.get("firstName") || "");
      state.profile.lastName = String(formData.get("lastName") || "");
      state.profile.email = String(formData.get("email") || "");
      state.profile.tier = String(formData.get("tier") || "");
      state.profile.newsletter = formData.get("newsletter") === "on";
      saveState(state);
      message.hidden = false;
      renderHero(state, "profile");
      renderSidebar(state, "profile");
    });

    resetButton.addEventListener("click", function () {
      state.profile = cloneTemplateState().profile;
      saveState(state);
      render(state, "profile");
    });
  }

  function bindAddressButtons(state) {
    document.querySelectorAll("[data-address-default]").forEach(function (button) {
      button.addEventListener("click", function () {
        var targetIndex = Number(button.getAttribute("data-address-default"));
        state.addresses = state.addresses.map(function (address, index) {
          address.defaultAddress = index === targetIndex;
          return address;
        });
        saveState(state);
        render(state, "addresses");
      });
    });

    document.querySelectorAll("[data-subscription-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        var targetIndex = Number(button.getAttribute("data-subscription-toggle"));
        var subscription = state.subscriptions[targetIndex];
        if (!subscription) {
          return;
        }
        subscription.status = subscription.status === "Active" ? "Paused" : "Active";
        saveState(state);
        render(state, "subscriptions");
      });
    });
  }

  function bindSubscriptions(state) {
    document.querySelectorAll("[data-subscription-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        var targetIndex = Number(button.getAttribute("data-subscription-toggle"));
        var subscription = state.subscriptions[targetIndex];
        if (!subscription) {
          return;
        }
        subscription.status = subscription.status === "Active" ? "Paused" : "Active";
        saveState(state);
        render(state, "subscriptions");
      });
    });
  }

  function wireInternalLinks(state) {
    document.querySelectorAll("[href]").forEach(function (link) {
      link.addEventListener("click", function () {
        saveState(state);
      });
    });

    if (getDisplayView(state, determineView()) === "subscriptions") {
      bindSubscriptions(state);
    }
  }

  function render(state, requestedView) {
    var activeView = getDisplayView(state, requestedView);
    renderHero(state, activeView);
    renderSidebar(state, activeView);
    renderContent(state, activeView);
    wireInternalLinks(state);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var state = loadState();
    render(state, determineView());

    window.addEventListener("popstate", function () {
      render(loadState(), determineView());
    });
  });
})();
