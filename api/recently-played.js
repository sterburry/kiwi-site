export default async function handler(req, res) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token
    })
  });

  const tokenData = await tokenResponse.json();
  const access_token = tokenData.access_token;

  const recentRes = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=5",
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  );

  const recentData = await recentRes.json();

  const tracks = recentData.items.map(item => ({
    title: item.track.name,
    artist: item.track.artists.map(a => a.name).join(", "),
    albumImage: item.track.album.images[0].url,
    songUrl: item.track.external_urls.spotify,
    playedAt: item.played_at
  }));

  return res.status(200).json({ tracks });
}
