export default async function handler(req, res) {
  const { title, artist } = req.query;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist" });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const queries = [
    `${title} ${artist} topic`,
    `${title} ${artist} lyrics`,
    `${title} ${artist} audio`,
    `${title} ${artist}`
  ];

  for (const q of queries) {
    try {
      const res2 = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=5&videoCategoryId=10&key=${apiKey}`
      );
      const data = await res2.json();
      if (!data.items || !data.items.length) continue;

      const filtered = data.items.filter(item => {
        const t = item.snippet.title.toLowerCase();
        const channel = item.snippet.channelTitle.toLowerCase();
        const isMV = t.includes("official video") || t.includes("music video") || t.includes("(mv)");
        const isLive = t.includes("live") || t.includes("concert") || t.includes("performance") || t.includes("tour");
        const isTopic = channel.includes("- topic");
        if (isTopic) return true;
        return !isMV && !isLive;
      });

      if (filtered.length) {
        return res.json({ videoId: filtered[0].id.videoId });
      }
    } catch {}
  }

  return res.json({ videoId: null });
}
