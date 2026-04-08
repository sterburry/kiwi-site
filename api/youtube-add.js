export default async function handler(req, res) {
  try {
    const { title, artist } = req.query;

    const token = req.cookies.youtube_access_token;

    if (!token) {
      return res.status(401).json({ error: "Not connected to YouTube" });
    }

    // 🎯 STEP 1: CREATE PLAYLIST (FIXED BODY)
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
            description: "Songs added from my website",
            defaultLanguage: "en"
          },
          status: {
            privacyStatus: "private"
          }
        })
      }
    );

    const playlistData = await createPlaylistRes.json();

    if (!playlistData.id) {
      return res.status(500).json({
        error: "Failed to create playlist",
        details: playlistData
      });
    }

    const playlistId = playlistData.id;

    // 🎯 STEP 2: SEARCH VIDEO
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(
        artist + " " + title
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const searchData = await searchRes.json();

    if (!searchData.items.length) {
      return res.status(404).json({ error: "No video found" });
    }

    const videoId = searchData.items[0].id.videoId;

    // 🎯 STEP 3: ADD TO PLAYLIST
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

    if (!addData.id) {
      return res.status(500).json({
        error: "Failed to add video",
        details: addData
      });
    }

    return res.json({ status: "added" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
