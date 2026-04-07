export default async function handler(req, res) {
  try {
    const { access_token, title, artist } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    if (!title || !artist) {
      return res.status(400).json({ error: "Missing song data" });
    }

    const playlistId = process.env.YOUTUBE_PLAYLIST_ID;

    // -------------------------------
    // 1. SEARCH YOUTUBE FOR VIDEO
    // -------------------------------
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        `${title} ${artist}`
      )}&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`
    );

    const searchData = await searchRes.json();
    const videoId = searchData?.items?.[0]?.id?.videoId;

    if (!videoId) {
      return res.status(404).json({ error: "No video found" });
    }

    // -------------------------------
    // 2. CHECK IF VIDEO ALREADY EXISTS
    // -------------------------------
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const playlistData = await playlistRes.json();

    const exists = playlistData.items?.some(
      (item) => item.contentDetails.videoId === videoId
    );

    if (exists) {
      return res.status(200).json({
        message: "Already in playlist 💿",
        videoId,
      });
    }

    // -------------------------------
    // 3. ADD TO PLAYLIST
    // -------------------------------
    const addRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId,
            },
          },
        }),
      }
    );

    const addData = await addRes.json();

    if (!addRes.ok) {
      return res.status(500).json({
        error: "Failed to add to playlist",
        details: addData,
      });
    }

    // -------------------------------
    // SUCCESS
    // -------------------------------
    return res.status(200).json({
      message: "Added to playlist ✅",
      videoId,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
