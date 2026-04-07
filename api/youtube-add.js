import fetch from "node-fetch";

export default async function handler(req, res) {
  const { title, artist } = req.body;

  const accessToken = process.env.YOUTUBE_ACCESS_TOKEN;
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID;

  if (!playlistId) {
    return res.json({ message: "Playlist not set up yet" });
  }

  /* 1. SEARCH VIDEO */
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      title + " " + artist
    )}&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`
  );

  const searchData = await searchRes.json();
  const videoId = searchData.items?.[0]?.id?.videoId;

  if (!videoId) {
    return res.json({ message: "No video found on YouTube" });
  }

  /* 2. CHECK PLAYLIST FOR DUPLICATES */
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const playlistData = await playlistRes.json();

  const alreadyExists = playlistData.items?.some(
    item => item.contentDetails.videoId === videoId
  );

  if (alreadyExists) {
    return res.json({
      message: "⚠️ Already in KIWI'S DIARY 💿"
    });
  }

  /* 3. ADD TO PLAYLIST */
  await fetch(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        snippet: {
          playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId
          }
        }
      })
    }
  );

  return res.json({
    message: "✅ Added to KIWI'S DIARY 💿"
  });
}
