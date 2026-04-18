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

    issues.sort((a, b) => {
      const da = a.createdAt || a.id;
      const db = b.createdAt || b.id;
      return da < db ? 1 : -1;
    });

    const latest = issues[0];

    metaEl.innerHTML = `
      <h3>${latest.title}</h3>
      <p class="bw-latest-date">
        ${latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ""}
      </p>
    `;

    frameWrapper.innerHTML = `
      <iframe
        src="${latest.path}"
        class="bw-latest-iframe"
        loading="lazy"
        title="Latest Boardwalk Newsletter"
      ></iframe>
    `;
  } catch (err) {
    metaEl.innerHTML = '<p>Unable to load latest issue.</p>';
  }
}

// ===============================
// SUBSCRIBE FORM
// ===============================
document.getElementById("subscribeForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("subscribeStatus");
  status.textContent = "Submitting…";

  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    await fetch("https://api.github.com/repos/boardwlkclay1/Newsletter/dispatches", {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${localStorage.getItem("gh_token")}`
      },
      body: JSON.stringify({
        event_type: "subscribe_user",
        client_payload: payload
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
