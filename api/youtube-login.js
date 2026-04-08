export default function handler(req, res) {
  const client_id = process.env.YOUTUBE_CLIENT_ID;
  const redirect_uri = process.env.YOUTUBE_REDIRECT_URI;

 const scope = "https://www.googleapis.com/auth/youtube.force-ssl";

 const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${process.env.YOUTUBE_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(process.env.YOUTUBE_REDIRECT_URI)}` +
  `&response_type=code` +
  `&access_type=offline` +
  `&prompt=consent` +
  `&scope=${encodeURIComponent(scope)}`;

  // 🚀 THIS WAS MISSING
  res.redirect(authUrl);
}
