export async function onRequestPost(context) {
  const { action, payload } = await context.request.json();

  const token = context.env.GITHUB_PAT;
  const owner = context.env.GITHUB_OWNER;
  const repo = context.env.GITHUB_REPO;

  await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      event_type: action,
      client_payload: payload
    })
  });

  return Response.json({ status: "ok" });
}
