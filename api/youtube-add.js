export default async function handler(req, res) {
  try {
    const token = req.cookies.youtube_access_token;

    if (!token) {
      return res.status(401).json({ error: "No token found" });
    }

    const { title, artist } = req.query;

    if (!title || !artist) {
      return res.status(400).json({ error: "Missing song info" });
    }

    // 🔍 STEP 1 — Search video
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
        `${title} ${artist}`
      )}&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const searchData = await searchRes.json();

    if (!searchData.items || !searchData.items.length) {
      return res.json({ error: "No video found" });
    }

    const videoId = searchData.items[0].id.videoId;

    // 🔥 STEP 2 — CREATE PLAYLIST (FIXED BODY)
    const playlistRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            title: "FROM KIWI <3",
            description: "Songs added from Kiwi site"
          },
          status: {
            privacyStatus: "private"
          }
        })
      }
    );

    const playlistData = await playlistRes.json();

    console.log("PLAYLIST RESPONSE:", playlistData);

    if (!playlistData.id) {
      return res.json({
        error: "Failed to create playlist",
        details: playlistData
      });
    }

    const playlistId = playlistData.id;

    // 🎵 STEP 3 — ADD VIDEO TO PLAYLIST
    const addRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: videoId
            }
          }
        })
      }
    );

    const addData = await addRes.json();

    console.log("ADD RESPONSE:", addData);

    if (addData.error) {
      return res.json({
        error: "Failed to add song",
        details: addData
      });
    }

    return res.json({ status: "added" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
