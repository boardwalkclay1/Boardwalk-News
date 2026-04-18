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
