// 네이버 검색 API(지역 검색)로 키워드별 노출 순위를, 검색광고 API로 월간 검색량을 가져온다.
import { createHmac } from "node:crypto";
import { env, store } from "../config";
import { demoRanks } from "../demo";
import type { KeywordRank, SourceResult } from "../types";
import { fetchJson, message, stripTags } from "./http";

interface LocalSearch {
  items: { title: string }[];
}

interface KeywordTool {
  keywordList: { relKeyword: string; monthlyPcQcCnt: number | string; monthlyMobileQcCnt: number | string }[];
}

function count(v: number | string): number {
  // 검색량이 아주 적으면 "< 10" 문자열로 온다
  return typeof v === "number" ? v : 5;
}

async function localRank(keyword: string, id: string, secret: string) {
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(keyword)}&display=5`;
  const res = await fetchJson<LocalSearch>(url, {
    headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
  });
  const titles = res.items.map((i) => stripTags(i.title));
  const idx = titles.findIndex((t) => t.replace(/\s/g, "").includes(store.name.replace(/\s/g, "")));
  return { rank: idx >= 0 ? idx + 1 : null, topStore: titles[0] ?? null, stores: titles };
}

async function monthlySearches(keyword: string, apiKey: string, secret: string, customer: string) {
  const uri = "/keywordstool";
  const ts = Date.now().toString();
  const signature = createHmac("sha256", secret).update(`${ts}.GET.${uri}`).digest("base64");
  const hint = keyword.replace(/\s/g, "");
  const res = await fetchJson<KeywordTool>(
    `https://api.searchad.naver.com${uri}?hintKeywords=${encodeURIComponent(hint)}&showDetail=1`,
    { headers: { "X-Timestamp": ts, "X-API-KEY": apiKey, "X-Customer": customer, "X-Signature": signature } },
  );
  const hit = res.keywordList.find((k) => k.relKeyword === hint) ?? res.keywordList[0];
  return hit ? count(hit.monthlyPcQcCnt) + count(hit.monthlyMobileQcCnt) : null;
}

export async function getKeywordRanks(): Promise<SourceResult<KeywordRank[]>> {
  const id = env("NAVER_CLIENT_ID");
  const secret = env("NAVER_CLIENT_SECRET");
  if (!id || !secret) {
    return { mode: "demo", data: demoRanks(), note: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 설정 시 실제 순위로 바뀝니다." };
  }
  const adKey = env("NAVER_AD_API_KEY");
  const adSecret = env("NAVER_AD_SECRET");
  const adCustomer = env("NAVER_AD_CUSTOMER_ID");
  try {
    const data = await Promise.all(
      store.keywords.map(async (keyword) => {
        const { rank, topStore, stores } = await localRank(keyword, id, secret);
        const volume = adKey && adSecret && adCustomer
          ? await monthlySearches(keyword, adKey, adSecret, adCustomer).catch(() => null)
          : null;
        return { keyword, rank, topStore, stores, monthlySearches: volume };
      }),
    );
    return {
      mode: "live",
      data,
      note: "네이버 지역검색 API는 상위 5개까지만 제공하므로 6위 이하는 '순위 밖'으로 표시됩니다.",
    };
  } catch (err) {
    return { mode: "error", data: demoRanks(), note: `네이버 API 오류: ${message(err)}` };
  }
}
