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

  const nowPlaying = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  );

  if (nowPlaying.status === 204 || nowPlaying.status > 400) {
    return res.status(200).json({ isPlaying: false });
  }

  const song = await nowPlaying.json();
// 🎧 GET ARTIST ID
const artistId = songData.item.artists[0].id;

// 🎧 FETCH ARTIST DATA (THIS CONTAINS GENRES)
const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const artistData = await artistRes.json();
const genres = artistData.genres || [];
 return res.status(200).json({
  title: songData.item.name,
  artist: songData.item.artists.map(a => a.name).join(", "),
  albumImage: songData.item.album.images[0].url,
  songUrl: songData.item.external_urls.spotify,
  isPlaying: true,
  genres: genres
});
}
