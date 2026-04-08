export default async function handler(req, res) {
  try {
    console.log("YouTube add triggered");

    const { title, artist } = req.query;

    /* 🔐 GET TOKEN FROM COOKIE (SAFE WAY) */
    const cookies = req.headers.cookie || "";
    const access_token = cookies
      .split("; ")
      .find(c => c.startsWith("youtube_access_token="))
      ?.split("=")[1];

    if (!access_token) {
      return res.status(200).json({
        status: "error",
        message: "Not authenticated"
      });
    }

    /* 🔍 SEARCH VIDEO */
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        artist + " " + title
      )}&type=video&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const searchData = await searchRes.json();

    if (!searchData.items || !searchData.items.length) {
      return res.status(200).json({
        status: "error",
        message: "No video found"
      });
    }

    const videoId = searchData.items[0].id.videoId;

    /* 📁 GET PLAYLISTS */
    const playlistsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const playlistsData = await playlistsRes.json();

    if (!playlistsData.items) {
      return res.status(200).json({
        status: "error",
        message: "Failed to fetch playlists"
      });
    }

    let playlist = playlistsData.items.find(
      (p) => p.snippet.title === "FROM KIWI <3"
    );

    /* ➕ CREATE PLAYLIST IF NOT EXISTS */
    if (!playlist) {
      const createRes = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              title: "FROM KIWI <3",
              description: "Songs from Kiwi's Diary 💚",
            },
            status: {
              privacyStatus: "private",
            },
          }),
        }
      );

      const createData = await createRes.json();

      if (!createRes.ok) {
        return res.status(200).json({
          status: "error",
          message: createData.error?.message || "Failed to create playlist"
        });
      }

      playlist = createData;
    }

    const playlistId = playlist.id;

    /* 🔍 CHECK DUPLICATES */
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const itemsData = await itemsRes.json();

    const exists = itemsData.items?.some(
      (item) => item.snippet.resourceId.videoId === videoId
    );

    if (exists) {
      return res.status(200).json({ status: "duplicate" });
    }

    /* ➕ ADD VIDEO */
    const addRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: videoId,
            },
          },
        }),
      }
    );

    const addData = await addRes.json();

    if (!addRes.ok) {
      return res.status(200).json({
        status: "error",
        message: addData.error?.message || "Failed to add song"
      });
    }

    return res.status(200).json({ status: "added" });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(200).json({
      status: "error",
      message: err.message
    });
  }
}
