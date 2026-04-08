export default async function handler(req, res) {
  try {
    const { title, artist } = req.query;

    const cookies = req.headers.cookie || "";
    const tokenMatch = cookies.match(/youtube_access_token=([^;]+)/);

    if (!tokenMatch) {
      return res.json({ status: "error", step: "auth_missing" });
    }

    const access_token = tokenMatch[1];

    console.log("TOKEN OK");

    // 🔍 SEARCH VIDEO
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

    const searchText = await searchRes.text();

    console.log("SEARCH RESPONSE:", searchText);

    let searchData;
    try {
      searchData = JSON.parse(searchText);
    } catch (e) {
      return res.json({
        status: "error",
        step: "search_parse_failed",
        raw: searchText
      });
    }

    if (searchData.error) {
      return res.json({
        status: "error",
        step: "youtube_search_error",
        details: searchData.error
      });
    }

    if (!searchData.items || searchData.items.length === 0) {
      return res.json({
        status: "error",
        step: "no_results"
      });
    }

    const videoId = searchData.items[0].id.videoId;

    return res.json({
      status: "debug_success",
      videoId
    });

  } catch (err) {
    return res.json({
      status: "error",
      step: "catch_block",
      message: err.message,
      stack: err.stack
    });
  }
}
