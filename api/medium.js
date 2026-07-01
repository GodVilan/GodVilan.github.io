// api/medium.js — server-side proxy that fetches Srikanth's Medium RSS feed and
// returns it as JSON, so the Writing section no longer depends on a third-party
// public proxy (api.rss2json.com). Response shape is kept compatible with what
// main.js already consumes: { status: "ok", items: [{ title, link, pubDate, description, content }] }.

const FEED_URL = process.env.MEDIUM_FEED_URL || "https://medium.com/feed/@srikanth2314";

function firstMatch(block, regexes) {
  for (const re of regexes) {
    const m = block.match(re);
    if (m && m[1] != null) return m[1];
  }
  return "";
}

function stripCdata(s) {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tag(block, name) {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i");
  const m = block.match(re);
  return m ? decodeEntities(stripCdata(m[1].trim())) : "";
}

function parseItems(xml) {
  const items = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[0];
    const title = tag(block, "title");
    const link = firstMatch(block, [/<link[^>]*>([\s\S]*?)<\/link>/i]);
    const pubDate = tag(block, "pubDate");
    // Medium puts the article HTML in <content:encoded>; <description> is a shorter summary.
    const content = tag(block, "content:encoded");
    const description = tag(block, "description") || content;
    if (title && link) {
      items.push({
        title,
        link: decodeEntities(link.trim()),
        pubDate,
        description,
        content: content || description,
      });
    }
  }
  return items;
}

module.exports = async function handler(req, res) {
  const allowOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const upstream = await fetch(FEED_URL, {
      headers: { "User-Agent": "srikanthreddynandireddy.me/1.0 (+medium-proxy)" },
    });
    if (!upstream.ok) {
      return res
        .status(502)
        .json({ status: "error", message: `Feed responded ${upstream.status}` });
    }
    const xml = await upstream.text();
    const items = parseItems(xml);

    // Cache at the edge for 30 min; serve stale while revalidating to keep Medium hits low.
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
    return res.status(200).json({ status: "ok", feed: FEED_URL, items });
  } catch (err) {
    console.error("medium.js error:", err?.message || err);
    return res.status(502).json({ status: "error", message: "Could not fetch the feed." });
  }
};
