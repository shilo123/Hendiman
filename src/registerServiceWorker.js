/* eslint-disable no-console */

import { register } from "register-service-worker";

// NOTE:
// Service worker caching can cause deploys to show a black screen when users
// have an old cached index.html referencing removed JS chunks.
// Default behavior:
// - If VUE_APP_ENABLE_PWA=true: register the Vue PWA service worker.
// - Else: unregister any existing SWs + clear caches (one-time cleanup).
if (process.env.NODE_ENV === "production") {
  const pwaEnabled = process.env.VUE_APP_ENABLE_PWA === "true";

  if (!pwaEnabled) {
    // Clean up any previously-registered SWs/caches from older deployments.
    // This helps avoid stale-cache black screens on hosting platforms.
    (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
        }

        // Clear cache storage (best-effort)
        if (typeof caches !== "undefined" && caches.keys) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch (e) {
        // Best-effort only
      }
    })();

    // Do not register the SW when PWA is disabled.
  } else {
    register(`${process.env.BASE_URL}service-worker.js`, {
      ready() {},
      registered() {},
      cached() {},
      updatefound() {},
      updated() {},
      offline() {},
      error(error) {},
    });
  }
}
