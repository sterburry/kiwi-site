export default async function handler(req, res) {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      return res.status(500).json(data);
    }

    // ✅ store token in cookie
    res.setHeader(
      "Set-Cookie",
      `youtube_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=None`
    );

    // ✅ redirect back to site
    res.redirect("/");
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
