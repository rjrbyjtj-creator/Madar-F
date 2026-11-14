/* MADAR CONNECT — resilient API transport for the existing Render backend.
 * This improves transient network failures and slow/cold starts. It does not bypass
 * ISP blocking or create availability when the origin itself is unreachable.
 */
(function () {
  "use strict";
  if (window.MadarConnect && window.MadarConnect.installed) return;

  var API_ORIGIN = "https://madar-jmy5.onrender.com";
  var HEALTH_URL = API_ORIGIN + "/health";
  var nativeFetch = window.fetch.bind(window);
  var state = {
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    backend: "unknown",
    latency: null,
    lastSuccess: null,
    lastFailure: null,
    lastError: null
  };
  var lastWarmupAt = 0;
  var warmupPromise = null;

  function emit() {
    try {
      window.dispatchEvent(new CustomEvent("madar:connection", { detail: Object.assign({}, state) }));
    } catch (e) {}
  }

  function setState(patch) {
    Object.assign(state, patch);
    emit();
  }

  function isMadarApi(input) {
    try {
      var raw = input && typeof input === "object" && "url" in input ? input.url : input;
      var url = new URL(String(raw), window.location.href);
      return url.origin === API_ORIGIN && url.pathname.indexOf("/api/") === 0;
    } catch (e) {
      return false;
    }
  }

  function getUrl(input) {
    try {
      return input && typeof input === "object" && "url" in input
        ? input.url
        : String(input);
    } catch (e) {
      return "";
    }
  }

  function getMethod(input, init) {
    return String((init && init.method) || (input && input.method) || "GET").toUpperCase();
  }

  function isAiRequest(input) {
    return /\/api\/ai\//i.test(getUrl(input));
  }

  function retryDelay(response, attempt) {
    var header = response && response.headers && response.headers.get("Retry-After");
    if (header) {
      var seconds = Number(header);
      if (Number.isFinite(seconds)) return Math.min(5000, Math.max(250, seconds * 1000));
      var date = Date.parse(header);
      if (Number.isFinite(date)) return Math.min(5000, Math.max(250, date - Date.now()));
    }
    return Math.min(2400, 350 * Math.pow(2, attempt));
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function makeAbortError() {
    var error = new Error("درخواست به‌دلیل طولانی‌شدن زمان پاسخ متوقف شد.");
    error.name = "TimeoutError";
    error.code = "MADAR_REQUEST_TIMEOUT";
    return error;
  }

  async function warmup(force) {
    var now = Date.now();
    if (!force && now - lastWarmupAt < 120000) return warmupPromise || Promise.resolve();
    if (warmupPromise) return warmupPromise;
    lastWarmupAt = now;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 18000);
    var started = Date.now();
    warmupPromise = nativeFetch(HEALTH_URL, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal
    }).then(function (response) {
      if (!response.ok) throw new Error("HEALTH_CHECK_" + response.status);
      setState({ backend: "online", latency: Date.now() - started, lastSuccess: Date.now(), lastError: null });
    }).catch(function (error) {
      setState({
        backend: "degraded",
        lastFailure: Date.now(),
        lastError: error && error.message ? error.message : "HEALTH_CHECK_FAILED"
      });
    }).finally(function () {
      clearTimeout(timer);
      warmupPromise = null;
    });
    return warmupPromise;
  }

  async function connectedFetch(input, init) {
    if (!isMadarApi(input)) return nativeFetch(input, init);

    var method = getMethod(input, init);
    var safeToRetry = method === "GET" || method === "HEAD";
    var maxAttempts = safeToRetry ? 3 : 1;
    var timeoutMs = isAiRequest(input) ? 180000 : (safeToRetry ? 35000 : 60000);
    var externalSignal = (init && init.signal) || (input && typeof input === "object" ? input.signal : null);
    var lastError;

    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      if (externalSignal && externalSignal.aborted) {
        throw new DOMException("درخواست توسط کاربر لغو شد.", "AbortError");
      }

      var controller = new AbortController();
      var timedOut = false;
      var timer = setTimeout(function () {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      var abortListener = null;

      if (externalSignal && typeof externalSignal.addEventListener === "function") {
        abortListener = function () { controller.abort(); };
        externalSignal.addEventListener("abort", abortListener, { once: true });
      }

      var requestInit = Object.assign({}, init || {}, { signal: controller.signal });
      var started = Date.now();

      try {
        var response = await nativeFetch(input, requestInit);
        clearTimeout(timer);
        if (externalSignal && abortListener) externalSignal.removeEventListener("abort", abortListener);

        var retryableStatus = [408, 425, 429, 500, 502, 503, 504].indexOf(response.status) !== -1;
        if (safeToRetry && retryableStatus && attempt < maxAttempts - 1) {
          try { if (response.body) await response.body.cancel(); } catch (e) {}
          setState({ backend: "degraded", lastFailure: Date.now(), lastError: "HTTP_" + response.status });
          await wait(retryDelay(response, attempt));
          continue;
        }

        if (response.ok) {
          setState({
            online: typeof navigator === "undefined" ? true : navigator.onLine,
            backend: "online",
            latency: Date.now() - started,
            lastSuccess: Date.now(),
            lastError: null
          });
        } else {
          setState({ backend: "degraded", lastFailure: Date.now(), lastError: "HTTP_" + response.status });
        }
        return response;
      } catch (error) {
        clearTimeout(timer);
        if (externalSignal && abortListener) externalSignal.removeEventListener("abort", abortListener);
        lastError = timedOut ? makeAbortError() : error;

        if (externalSignal && externalSignal.aborted) throw error;
        setState({
          backend: "degraded",
          lastFailure: Date.now(),
          lastError: lastError && lastError.message ? lastError.message : "NETWORK_ERROR"
        });

        if (!safeToRetry || attempt >= maxAttempts - 1) throw lastError;
        await wait(Math.min(2400, 350 * Math.pow(2, attempt)));
      }
    }
    throw lastError || new Error("MADAR_CONNECTION_FAILED");
  }

  window.fetch = connectedFetch;
  window.MadarConnect = Object.freeze({
    installed: true,
    request: connectedFetch,
    warmup: warmup,
    getStatus: function () { return Object.assign({}, state); },
    onChange: function (callback) {
      if (typeof callback !== "function") return function () {};
      var handler = function (event) { callback(event.detail); };
      window.addEventListener("madar:connection", handler);
      callback(Object.assign({}, state));
      return function () { window.removeEventListener("madar:connection", handler); };
    }
  });

  window.addEventListener("online", function () {
    setState({ online: true });
    warmup(true);
  });
  window.addEventListener("offline", function () {
    setState({ online: false, backend: "unreachable", lastError: "BROWSER_OFFLINE" });
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") warmup(false);
  });

  if (typeof navigator === "undefined" || navigator.onLine) {
    setTimeout(function () { warmup(false); }, 0);
  }
})();