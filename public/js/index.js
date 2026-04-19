// ===============================
// LOAD LATEST ISSUE (NO IFRAME)
// ===============================
async function loadLatestIssue() {
  const metaEl = document.getElementById('latestIssueMeta');
  const linkEl = document.getElementById('latestIssueLink');

  try {
    const res = await fetch('/data/issues/index.json', { cache: 'no-store' });
    const issues = await res.json();

    if (!issues.length) {
      metaEl.innerHTML = '<p>No issues published yet.</p>';
      return;
    }

    // newest → oldest
    issues.sort((a, b) => {
      const da = a.createdAt || a.id;
      const db = b.createdAt || b.id;
      return da < db ? 1 : -1;
    });

    const latest = issues[0];

    metaEl.innerHTML = `
      <h3>${latest.title}</h3>
      <p>${latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ""}</p>
    `;

    // link to the actual newsletter file
    linkEl.href = latest.path;
  } catch (err) {
    metaEl.innerHTML = '<p>Unable to load latest issue.</p>';
  }
}

loadLatestIssue();
