// public/app.js

// ===============================
// SERVICE WORKER
// ===============================
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  }
}

// ===============================
// BUILD SUBSCRIBER OBJECT
// ===============================
function buildSubscriberFromForm(form) {
  const data = new FormData(form);

  const email = data.get('email')?.trim() || '';
  const phone = data.get('phone')?.trim() || '';

  const channels = {
    email: data.get('channelEmail') === 'on',
    sms: data.get('channelSms') === 'on',
    app: data.get('channelApp') === 'on',
    socialDm: false
  };

  const preferences = {
    beltlineOnly:
      data.get('topicBeltline') === 'on' &&
      data.get('topicSkatingLocal') !== 'on' &&
      data.get('topicSkatingNational') !== 'on' &&
      data.get('topicSkatingGlobal') !== 'on',

    skatingOnly:
      data.get('topicBeltline') !== 'on' &&
      (data.get('topicSkatingLocal') === 'on' ||
       data.get('topicSkatingNational') === 'on' ||
       data.get('topicSkatingGlobal') === 'on'),

    includeGlobal: data.get('topicSkatingGlobal') === 'on',

    topics: {
      beltline: data.get('topicBeltline') === 'on',
      skatingLocal: data.get('topicSkatingLocal') === 'on',
      skatingNational: data.get('topicSkatingNational') === 'on',
      skatingGlobal: data.get('topicSkatingGlobal') === 'on'
    },

    frequency: data.get('frequency') || 'twice-weekly'
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
    verified: false
  };
}

// ===============================
// SEND SUBSCRIBER TO GITHUB (repo_dispatch)
// ===============================
async function sendSubscriberToGitHub(subscriber) {
  // IMPORTANT:
  // Replace these with your actual GitHub username + repo name.
  const owner = "<YOUR_GITHUB_USERNAME>";
  const repo = "<YOUR_REPO_NAME>";

  // This token must be stored in Cloudflare Pages environment variables
  // OR replaced with a GitHub fine-scoped PAT.
  const token = "<YOUR_GITHUB_PAT>";

  const payload = {
    event_type: "add_subscriber",
    client_payload: {
      subscriber: JSON.stringify(subscriber)
    }
  };

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`GitHub dispatch failed: ${res.status}`);
  }

  return true;
}

// ===============================
// LOCAL FALLBACK STORAGE
// ===============================
function saveSubscriberLocally(subscriber) {
  const key = 'boardwalk_subscribers_local';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(subscriber);
  localStorage.setItem(key, JSON.stringify(existing));
}

// ===============================
// SUBSCRIBE FORM HANDLER
// ===============================
function setupSubscribeForm() {
  const form = document.getElementById('subscribeForm');
  const statusEl = document.getElementById('subscribeStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Saving your preferences...';
    statusEl.className = 'bw-status';

    const subscriber = buildSubscriberFromForm(form);

    try {
      await sendSubscriberToGitHub(subscriber);
      statusEl.textContent = 'You are in. Check your email or app soon.';
      statusEl.className = 'bw-status ok';
    } catch (err) {
      console.warn('GitHub dispatch failed, storing locally only', err);
      saveSubscriberLocally(subscriber);
      statusEl.textContent = 'Saved locally. Backend not connected yet.';
      statusEl.className = 'bw-status err';
    }

    form.reset();
  });
}

// ===============================
// LOAD ISSUES LIST
// ===============================
async function loadIssuesList() {
  const listEl = document.getElementById('issuesList');
  if (!listEl) return;

  try {
    const res = await fetch('/data/issues/index.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No index yet');
    const issues = await res.json();

    if (!Array.isArray(issues) || !issues.length) {
      listEl.innerHTML = '<li>No issues published yet.</li>';
      return;
    }

    listEl.innerHTML = issues
      .map(issue => {
        const date = issue.createdAt?.slice(0, 10) || issue.id;
        return `<li><a href="/issues/issue-${issue.id}.html">${issue.title}</a> <span>(${date})</span></li>`;
      })
      .join('');
  } catch {
    listEl.innerHTML = '<li>Issues will appear here once you publish.</li>';
  }
}

// ===============================
// INIT
// ===============================
registerServiceWorker();
setupSubscribeForm();
loadIssuesList();
