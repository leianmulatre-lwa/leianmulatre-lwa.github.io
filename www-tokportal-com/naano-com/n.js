(function () {
  var ENDPOINT = "https://naano.com" + "/api/nn/e";
  var KEY = "nn_cid";
  var script = document.currentScript;
  var SITE = script && script.getAttribute("data-site");

  function isCid(val) {
    return typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  }
  function readParam(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }
  function readCookie() {
    try {
      var parts = document.cookie.split(";");
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.indexOf(KEY + "=") === 0) {
          var val = decodeURIComponent(p.slice(KEY.length + 1));
          if (isCid(val)) return val;
        }
      }
    } catch (e) {}
    return null;
  }
  function hasCookieValue(val) {
    try {
      return document.cookie.split(";").some(function (part) {
        var p = part.trim();
        return p.indexOf(KEY + "=") === 0 && decodeURIComponent(p.slice(KEY.length + 1)) === val;
      });
    } catch (e) { return false; }
  }
  function setCookie(val) {
    if (!isCid(val)) return;
    var secure = location.protocol === "https:" ? ";Secure" : "";
    var encoded = encodeURIComponent(val);
    // Remove a stale host-only value first. Otherwise it can shadow the new
    // registrable-domain cookie and prevent attribution across www/app.
    document.cookie = KEY + "=;path=/;max-age=0;SameSite=Lax" + secure;
    // Walk up to the registrable domain so www.x.com capture survives on app.x.com.
    var host = location.hostname.split(".");
    // For an apex host (x.com), index 0 is the registrable domain itself.
    var minIndex = host.length === 2 ? 0 : 1;
    for (var i = host.length - 2; i >= minIndex; i--) {
      var d = "." + host.slice(i).join(".");
      document.cookie = KEY + "=" + encoded + ";path=/;domain=" + d + ";max-age=5184000;SameSite=Lax" + secure;
      if (hasCookieValue(val)) return;
    }
    document.cookie = KEY + "=" + encoded + ";path=/;max-age=5184000;SameSite=Lax" + secure;
  }
  function clearAttributionParams() {
    try {
      var params = new URLSearchParams(location.search);
      if (!params.has("naano_session") && !params.has("nn_cid")) return;
      params.delete("naano_session");
      params.delete("nn_cid");
      var query = params.toString();
      window.history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + (location.hash || ""));
    } catch (e) {}
  }
  function readStored() {
    var fromCookie = readCookie();
    if (fromCookie) return fromCookie;
    try {
      var fromStorage = localStorage.getItem(KEY);
      return isCid(fromStorage) ? fromStorage : null;
    } catch (e) { return null; }
  }
  function getCid() {
    var fromUrl = readParam("naano_session") || readParam("nn_cid");
    if (fromUrl) clearAttributionParams();
    if (isCid(fromUrl)) {
      try { localStorage.setItem(KEY, fromUrl); } catch (e) {}
      setCookie(fromUrl);
      return fromUrl;
    }
    return readStored();
  }

  function beacon(body, event) {
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) {
        notify(event, "beacon");
        return true;
      }
    } catch (e) {}
    return false;
  }

  function fetchRequest(body) {
    return fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: body
    });
  }

  function sendConversion(body, event, onFailure, canRetry) {
    var attemptsLeft = canRetry ? 2 : 0;
    function failed() {
      try { if (onFailure) onFailure(); } catch (e) {}
      notify(event, "fetch_error");
    }
    function attempt() {
      var request;
      try { request = fetchRequest(body); } catch (e) {
        if (beacon(body, event)) return true;
        failed();
        return false;
      }
      if (!request || !request.then) {
        if (beacon(body, event)) return true;
        failed();
        return false;
      }
      request.then(function (response) {
        if (response && response.ok) {
          notify(event, "fetch");
        } else if (
          attemptsLeft-- > 0 &&
          (!response || response.status >= 500)
        ) {
          notify(event, "fetch_retry");
          attempt();
        } else {
          failed();
        }
      }, function () {
        if (attemptsLeft-- > 0) {
          notify(event, "fetch_retry");
          attempt();
        } else if (canRetry && beacon(body, event)) {
          return;
        } else {
          failed();
        }
      });
      return true;
    }
    return attempt();
  }

  function send(event, props, onFailure) {
    if (!SITE) return false;
    var cid = getCid();
    var body = JSON.stringify({
      v: 1, site: SITE, event: event, cid: cid,
      url: location.origin + location.pathname,
      value: props && props.value, currency: "EUR",
      order_id: props && (props.order_id || props.orderId),
      email: props && props.email
    });
    // Conversions need an observable HTTP result. Unlike sendBeacon, fetch lets
    // us retry transient 5xx responses and release the signup marker after a
    // definitive failure. Ping/visit remain beacon-first and lightweight.
    if (event === "signup" || event === "purchase") {
      var canRetry = event === "purchase" || !!cid || !!(props && props.email);
      return sendConversion(body, event, onFailure, canRetry);
    }
    if (beacon(body, event)) return true;
    try {
      var request = fetchRequest(body);
      // fetch() can fail asynchronously (CSP, ad blocker, network, HTTP error).
      // Release the caller's throttle/dedup marker so a later call can retry.
      if (request && request.then) request.then(function (response) {
        if (response && response.ok === false) {
          try { if (onFailure) onFailure(); } catch (e) {}
          notify(event, "fetch_error");
        }
      }, function () {
        try { if (onFailure) onFailure(); } catch (e) {}
        notify(event, "fetch_error");
      });
      notify(event, "fetch");
      return true;
    } catch (e) { return false; }
  }

  // Tiny, payload-free hook used by the localhost harness. Customer sites can
  // ignore it; no email, URL, key or visitor id is exposed in the event.
  function notify(event, transport) {
    try {
      window.dispatchEvent(new CustomEvent("naano:pixel-dispatch", {
        detail: { event: event, transport: transport }
      }));
    } catch (e) {}
  }

  function track(event, props) {
    if (event === "subscription") event = "purchase";
    if (event === "signup") {
      try {
        var signupKey = "nn_signup_sent:" + SITE + ":" + (getCid() || "direct");
        if (sessionStorage.getItem(signupKey)) return false;
        var queued = send(event, props || {}, function () {
          try { sessionStorage.removeItem(signupKey); } catch (e) {}
        });
        // A synchronous refusal (missing site key, beacon=false + fetch throw)
        // must remain retryable in the same session.
        if (queued) sessionStorage.setItem(signupKey, "1");
        return queued;
      } catch (e) {}
    }
    return send(event, props || {});
  }

  // Health ping, throttled 1/h per visitor.
  try {
    var pingKey = "nn_ping:" + SITE;
    var last = +(localStorage.getItem(pingKey) || 0);
    if (Date.now() - last > 3600000 && send("ping", {}, function () {
      try { localStorage.removeItem(pingKey); } catch (e) {}
    })) {
      localStorage.setItem(pingKey, "" + Date.now());
    }
  } catch (e) {}

  // Capture cid on load, then replace the stub and replay its queue.
  getCid();

  // Awareness: one "visit" per day per visitor, only when a creator id exists
  // (the server dedups per UTC day anyway; this just avoids useless requests).
  try {
    var visitCid = readStored();
    if (visitCid) {
      var day = new Date().toISOString().slice(0, 10);
      var visitKey = "nn_visit:" + SITE + ":" + visitCid;
      if (localStorage.getItem(visitKey) !== day && send("visit", {}, function () {
        try { localStorage.removeItem(visitKey); } catch (e) {}
      })) {
        localStorage.setItem(visitKey, day);
      }
    }
  } catch (e) {}

  var q = (window.naano && window.naano.q) || [];
  window.naano = function () {
    var a = arguments;
    if (a[0] === "track") return track(a[1], a[2]);
    return false;
  };
  for (var i = 0; i < q.length; i++) window.naano.apply(null, q[i]);
})();