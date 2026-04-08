export default async function handler(req, res) {
  try {
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

    const access_token = data.access_token;

    if (!access_token) {
      return res.status(400).send("No access token received");
    }

    /* ✅ SAVE TOKEN IN COOKIE */
    res.setHeader(
      "Set-Cookie",
      `youtube_access_token=${access_token}; Path=/; HttpOnly; Secure; SameSite=None`
    );

    /* ✅ REDIRECT BACK TO SITE */
    res.redirect("/");

  } catch (err) {
    res.status(500).send("OAuth failed");
  }
}
