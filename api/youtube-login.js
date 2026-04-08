export default function handler(req, res) {
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.YOUTUBE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.YOUTUBE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&scope=${encodeURIComponent(
      "https://www.googleapis.com/auth/youtube.force-ssl"
    )}`;

  res.redirect(authUrl);
}
