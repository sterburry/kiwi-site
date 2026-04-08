export default async function handler(req, res) {
  try {
    const { title, artist } = req.query;

    const token = req.cookies.youtube_access_token;

    if (!token) {
      return res.status(401).json({ error: "Not connected to YouTube" });
    }

    // 🔍 Step 1: Create playlist
    const createPlaylistRes = await fetch(
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
            description: "playlist created by kiwi",
            defaultLanguage: "en"
          },
          status: {
            privacyStatus: "private"
          }
        })
      }
    );

    const playlistData = await createPlaylistRes.json();
    console.log("PLAYLIST RESPONSE:", playlistData);

    if (!playlistData.id) {
      return res.status(500).json({
        error: "Failed to create playlist",
        details: playlistData
      });
    }

    const playlistId = playlistData.id;

    // 🔍 Step 2: Search video
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        artist + " " + title
      )}&type=video&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const searchData = await searchRes.json();

    if (!searchData.items?.length) {
      return res.status(404).json({ error: "No video found" });
    }

    const videoId = searchData.items[0].id.videoId;

    // 🔍 Step 3: Add to playlist
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
      return res.status(500).json({
        error: "Failed to add song",
        details: addData
      });
    }

    return res.json({ status: "added" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
