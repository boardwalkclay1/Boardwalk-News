// public/app.js

// ===============================
// SERVICE WORKER
// ===============================
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (e) {
      console.warn("SW registration failed", e);
    }
  }
}

// ===============================
// BUILD SUBSCRIBER OBJECT
// ===============================
function buildSubscriberFromForm(form) {
  const data = new FormData(form);

  const email = data.get("email")?.trim() || "";
  const phone = data.get("phone")?.trim() || "";

  const channels = {
    email: data.get("channelEmail") === "on",
    sms: data.get("channelSms") === "on",
    app: data.get("channelApp") === "on",
    socialDm: false
  };

  const preferences = {
    beltlineOnly:
      data.get("topicBeltline") === "on" &&
      data.get("topicSkatingLocal") !== "on" &&
      data.get("topicSkatingNational") !== "on" &&
      data.get("topicSkatingGlobal") !== "on",

    skatingOnly:
      data.get("topicBeltline") !== "on" &&
      (data.get("topicSkatingLocal") === "on" ||
        data.get("topicSkatingNational") === "on" ||
        data.get("topicSkatingGlobal") === "on"),

    includeGlobal: data.get("topicSkatingGlobal") === "on",

    topics: {
      beltline: data.get("topicBeltline") === "on",
      skatingLocal: data.get("topicSkatingLocal") === "on",
      skatingNational: data.get("topicSkatingNational") === "on",
      skatingGlobal: data.get("topicSkatingGlobal") === "on"
    },

    frequency: data.get("frequency") || "twice-weekly"
  };

  const now = new Date().toISOString();

  return {
    id: `sub_${crypto.randomUUID()}`,
    email: email || null,
    phone: phone || null,
    appUserId: null,
    channels,
    preferences,
    createdAt: now,
    verified: false,
    verifyToken: crypto.randomUUID()
  };
}

// ===============================
// SEND SUBSCRIBER TO GITHUB (repo_dispatch)
// ===============================
async function sendSubscriberToGitHub(subscriber) {
  // ⭐ Cloudflare Pages Environment Variables
  const owner = import.meta.env.GITHUB_OWNER;
  const repo = import.meta.env.GITHUB_REPO;
  const token = import.meta.env.GITHUB_PAT;

  const payload = {
    event_type: "add_subscriber",
    client_payload: {
      subscriber: JSON.stringify(subscriber)
    }
  };

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub dispatch failed: ${res.status}`);
  }

  return true;
}

// ===============================
// LOCAL FALLBACK STORAGE
// ===============================
function saveSubscriberLocally(subscriber) {
  const key = "boardwalk_subscribers_local";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(subscriber);
  localStorage.setItem(key, JSON.stringify(existing));
}

// ===============================
// SUBSCRIBE FORM HANDLER
// ===============================
function setupSubscribeForm() {
  const form = document.getElementById("subscribeForm");
  const statusEl = document.getElementById("subscribeStatus");
  if (!form) return;

