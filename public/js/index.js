// ===============================
// LOAD LATEST ISSUE
// ===============================
async function loadLatestIssue() {
  const metaEl = document.getElementById('latestIssueMeta');
  const frameWrapper = document.getElementById('latestIssueFrameWrapper');

  try {
    const res = await fetch('/data/issues/index.json', { cache: 'no-store' });
    const issues = await res.json();

    if (!issues.length) {
      metaEl.innerHTML = '<p>No issues published yet.</p>';
      return;
    }

    // Sort newest → oldest
    issues.sort((a, b) => {
      const da = a.createdAt || a.id;
      const db = b.createdAt || b.id;
      return da < db ? 1 : -1;
    });

    const latest = issues[0];

    // Metadata
    metaEl.innerHTML = `
      <h3>${latest.title}</h3>
      <p class="bw-latest-date">
        ${latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ""}
      </p>
    `;

    // Prevent homepage from loading itself
    // Ensure ONLY newsletter HTML files load
    const safePath =
      latest.path &&
      latest.path !== "/" &&
      !latest.path.includes("index.html")
        ? latest.path
        : `/issues/${latest.id}.html`;

    frameWrapper.innerHTML = `
      <iframe
        src="${safePath}"
        class="bw-latest-iframe"
        loading="lazy"
        title="Latest Boardwalk Newsletter"
        style="width:100%; height:100%; border:none;"
      ></iframe>
    `;
  } catch (err) {
    metaEl.innerHTML = '<p>Unable to load latest issue.</p>';
  }
}

// ===============================
// SUBSCRIBE FORM (CLOUDFLARE FUNCTION)
// ===============================
document.getElementById("subscribeForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("subscribeStatus");
  status.textContent = "Submitting…";

  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "subscribe_user",
        payload
      })
    });

    status.textContent = "Check your email to verify!";
    status.className = "bw-status ok";
  } catch {
    status.textContent = "Subscription failed.";
    status.className = "bw-status err";
  }
});

// ===============================
// INIT
// ===============================
loadLatestIssue();
