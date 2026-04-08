export default async function handler(req, res) {
  const code = req.query.code;

  const client_id = process.env.YOUTUBE_CLIENT_ID;
  const client_secret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirect_uri = process.env.YOUTUBE_REDIRECT_URI;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: "authorization_code"
    })
  });

  const data = await tokenRes.json();

  // ⚠️ For now we just redirect with token in URL (simple version)
  // Later we store properly in DB
  res.redirect(`/?access_token=${data.access_token}`);
}
res.setHeader(
  "Set-Cookie",
  `youtube_access_token=${access_token}; Path=/; HttpOnly; Secure; SameSite=None`
);
