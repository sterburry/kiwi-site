export default async function handler(req, res) {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      return res.json({ status: "error", step: "missing_params" });
    }

    const cookies = req.headers.cookie || "";
    const tokenMatch = cookies.match(/youtube_access_token=([^;]+)/);

    if (!tokenMatch) {
      return res.json({ status: "error", step: "auth_missing" });
    }

    const access_token = tokenMatch[1];

    // 1. SEARCH VIDEO
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        artist + " " + title
      )}&type=video&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return res.json({ status: "error", step: "no_results" });
    }

    const videoId = searchData.items[0].id.videoId;

    // 2. CHECK EXISTING PLAYLISTS
    const playlistsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const playlistsData = await playlistsRes.json();

    let playlist = playlistsData.items?.find(
      (p) => p.snippet.title === "FROM KIWI <3"
    );

    // 3. CREATE PLAYLIST IF NOT EXISTS
    if (!playlist) {
      const createRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet,status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            snippet: {
              title: "FROM KIWI <3",
              description: "Auto-generated playlist"
            },
            status: {
              privacyStatus: "private"
            }
          })
        }
      );

      const createData = await createRes.json();
      playlist = createData;
    }

    const playlistId = playlist.id;

    // 4. ADD VIDEO
    const addRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
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

    const addData = await addRes.json();

    // 5. SUCCESS
    return res.json({
      status: "added",
      videoId,
      playlistId
    });

  } catch (err) {
    return res.json({
      status: "error",
      step: "catch",
      message: err.message
    });
  }
}
