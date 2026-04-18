// ===============================
// LOAD LATEST ISSUE (for index.html)
// ===============================
export async function loadLatestIssue() {
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
    console.error('Failed to load latest issue', err);
    metaEl.innerHTML = '<p>Error loading latest issue.</p>';
  }
}

// ===============================
// LOAD ALL ISSUES (for newsletter.html)
// ===============================
export async function loadAllIssues() {
  const listEl = document.getElementById('allIssuesList');

  try {
    const res = await fetch('/data/issues/index.json', { cache: 'no-store' });
    const issues = await res.json();

    if (!issues.length) {
      listEl.innerHTML = '<li>No issues published yet.</li>';
      return;
    }

    // Sort newest → oldest
    issues.sort((a, b) => {
      const da = a.createdAt || a.id;
      const db = b.createdAt || b.id;
      return da < db ? 1 : -1;
    });

    listEl.innerHTML = issues
      .map(
        (i) => `
        <li class="bw-issue-item">
          <a href="${i.path}">
            <strong>${i.title}</strong>
            <span class="bw-issue-date">
              ${i.createdAt ? new Date(i.createdAt).toLocaleDateString() : ""}
            </span>
          </a>
        </li>
      `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load issues', err);
    listEl.innerHTML = '<li>Error loading issues.</li>';
  }
}
