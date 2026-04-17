// public/app.js

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  }
}

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
    beltlineOnly: data.get('topicBeltline') === 'on' &&
                  data.get('topicSkatingLocal') !== 'on' &&
                  data.get('topicSkatingNational') !== 'on' &&
                  data.get('topicSkatingGlobal') !== 'on',
    skatingOnly: data.get('topicBeltline') !== 'on' &&
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

async function sendSubscriberToBackend(subscriber) {
  // This is the hook into your “newsletter studio” backend.
  // Later you implement /api/subscribe on Cloudflare / another service.
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscriber)
  });

  if (!res.ok) {
    throw new Error(`Subscribe failed: ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

function saveSubscriberLocally(subscriber) {
  const key = 'boardwalk_subscribers_local';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(subscriber);
  localStorage.setItem(key, JSON.stringify(existing));
}

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
      await sendSubscriberToBackend(subscriber);
      statusEl.textContent = 'You are in. Check your email or app soon.';
      statusEl.className = 'bw-status ok';
    } catch (err) {
      console.warn('Backend subscribe failed, storing locally only', err);
      saveSubscriberLocally(subscriber);
      statusEl.textContent = 'Saved locally. Backend not connected yet.';
      statusEl.className = 'bw-status err';
    }

    form.reset();
  });
}

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

registerServiceWorker();
setupSubscribeForm();
loadIssuesList();
