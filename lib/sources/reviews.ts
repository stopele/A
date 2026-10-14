// 구글 지도(Places API New)에서 평점과 최근 리뷰를 가져온다.
// 네이버 플레이스·배달앱 리뷰는 공식 API가 없어 샘플로 남겨둔다.
import { env, store } from "../config";
import { demoReviews, ymd } from "../demo";
import type { ReviewSummary, SourceResult } from "../types";
import { fetchJson, message } from "./http";

interface PlacesSearch {
  places?: {
    rating?: number;
    userRatingCount?: number;
    reviews?: {
      rating?: number;
      text?: { text: string };
      authorAttribution?: { displayName?: string };
      publishTime?: string;
    }[];
  }[];
}

export async function getReviews(): Promise<SourceResult<ReviewSummary>> {
  const key = env("GOOGLE_MAPS_API_KEY");
  if (!key) {
    return { mode: "demo", data: demoReviews(), note: "GOOGLE_MAPS_API_KEY 설정 시 구글 지도 리뷰가 연동됩니다." };
  }
  try {
    const res = await fetchJson<PlacesSearch>("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.rating,places.userRatingCount,places.reviews",
      },
      body: JSON.stringify({ textQuery: `${store.name} ${store.region}`, languageCode: "ko" }),
    });
    const place = res.places?.[0];
    if (!place) throw new Error(`'${store.name}' 매장을 구글 지도에서 찾지 못했습니다.`);
    const recent = (place.reviews ?? []).map((r) => ({
      source: "구글",
      author: r.authorAttribution?.displayName ?? "익명",
      rating: r.rating ?? null,
      text: r.text?.text ?? "",
      date: r.publishTime ? ymd(new Date(r.publishTime)) : "",
    }));
    const thisMonth = ymd(new Date()).slice(0, 7);
    return {
      mode: "live",
      data: {
        // 구글은 최근 리뷰 최대 5개만 주므로 월별 건수는 정확히 셀 수 없다
        monthCount: null,
        lastMonthCount: null,
        totalCount: place.userRatingCount ?? null,
        averageRating: place.rating ?? null,
        recent: recent.sort((a, b) => b.date.localeCompare(a.date)),
      },
      note: `구글 리뷰 기준 (이번 달 최근 리뷰 ${recent.filter((r) => r.date.startsWith(thisMonth)).length}건 표시). 네이버·배달앱 리뷰는 공식 API가 없습니다.`,
    };
  } catch (err) {
    return { mode: "error", data: demoReviews(), note: `구글 API 오류: ${message(err)}` };
  }
}
