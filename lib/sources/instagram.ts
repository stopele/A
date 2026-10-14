// 인스타그램 Graph API 해시태그 검색으로 최근 24시간 게시물을 모은다.
// 비즈니스/크리에이터 계정과 페이스북 앱 토큰이 필요하다.
import { env, type Store } from "../config";
import { demoSns, ymd } from "../demo";
import type { SnsPost, SnsSummary, SourceResult } from "../types";
import { fetchJson, message } from "./http";

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? "v21.0"}`;

interface Media {
  id: string;
  caption?: string;
  permalink: string;
  timestamp: string;
}

export async function getSns(store: Store): Promise<SourceResult<SnsSummary>> {
  const token = env("INSTAGRAM_ACCESS_TOKEN");
  const userId = env("INSTAGRAM_USER_ID");
  if (!token || !userId) {
    return { mode: "demo", data: demoSns(store), note: "INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID 설정 시 실제 해시태그 게시물이 연동됩니다." };
  }
  try {
    const seen = new Map<string, Media>();
    for (const tag of store.hashtags) {
      const search = await fetchJson<{ data: { id: string }[] }>(
        `${GRAPH}/ig_hashtag_search?user_id=${userId}&q=${encodeURIComponent(tag)}&access_token=${token}`,
      );
      const hashtagId = search.data[0]?.id;
      if (!hashtagId) continue;
      const media = await fetchJson<{ data: Media[] }>(
        `${GRAPH}/${hashtagId}/recent_media?user_id=${userId}&fields=id,caption,permalink,timestamp&limit=50&access_token=${token}`,
      );
      for (const m of media.data) seen.set(m.id, m);
    }
    const posts = [...seen.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const yesterday = ymd(new Date(Date.now() - 86400_000));
    const tagCounts = new Map<string, number>();
    for (const p of posts) {
      for (const t of p.caption?.match(/#[^\s#]+/g) ?? []) {
        const tag = t.slice(1);
        if (!store.hashtags.includes(tag)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const recent: SnsPost[] = posts.slice(0, 10).map((p) => ({
      store: store.name,
      caption: (p.caption ?? "").slice(0, 80),
      url: p.permalink,
      date: ymd(new Date(p.timestamp)),
    }));
    return {
      mode: "live",
      data: {
        yesterdayMentions: posts.filter((p) => ymd(new Date(p.timestamp)) === yesterday).length,
        recent,
        relatedTags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t),
      },
      note: `#${store.hashtags.join(" #")} 최근 게시물 기준`,
    };
  } catch (err) {
    return { mode: "error", data: demoSns(store), note: `인스타그램 API 오류: ${message(err)}` };
  }
}
