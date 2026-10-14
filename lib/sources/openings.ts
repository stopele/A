// 지방행정 인허가 데이터(LOCALDATA)에서 최근 인허가된 음식점 중 매장 지역에 있는 곳을 찾는다.
import { env, store } from "../config";
import { demoOpenings, ymd } from "../demo";
import type { NewBusiness, SourceResult } from "../types";
import { fetchJson, message } from "./http";

const DEFAULT_URL = "https://www.localdata.go.kr/platform/rest/TO0/openDataApi";
// 07_24_04_P: 일반음식점, 07_24_05_P: 휴게음식점
const SERVICES = [
  { id: "07_24_04_P", label: "일반음식점" },
  { id: "07_24_05_P", label: "휴게음식점" },
];

interface Row {
  bplcNm?: string;
  uptaeNm?: string;
  rdnWhlAddr?: string;
  siteWhlAddr?: string;
  apvPermYmd?: string;
  trdStateGbn?: string;
}

interface Response {
  result?: { body?: { rows?: { row?: Row[] }[] } };
}

function compact(d: Date): string {
  return ymd(d).replaceAll("-", "");
}

function dashed(ymd: string): string {
  const s = ymd.replaceAll("-", "");
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export async function getOpenings(): Promise<SourceResult<NewBusiness[]>> {
  const key = env("LOCALDATA_API_KEY");
  if (!key) {
    return { mode: "demo", data: demoOpenings(), note: "LOCALDATA_API_KEY 설정 시 실제 인허가 데이터가 연동됩니다." };
  }
  const base = env("LOCALDATA_API_URL") ?? DEFAULT_URL;
  const end = new Date();
  const begin = new Date(Date.now() - 30 * 86400_000);
  // "경기도 남양주시 진접읍" → 마지막 두 단어로 주소를 거른다
  const area = store.region.split(/\s+/).slice(-2).join(" ");
  try {
    const found: NewBusiness[] = [];
    for (const svc of SERVICES) {
      const url = `${base}?authKey=${key}&opnSvcId=${svc.id}&lastModTsBgn=${compact(begin)}&lastModTsEnd=${compact(end)}&resultType=json&pageSize=500`;
      const res = await fetchJson<Response>(url);
      const rows = res.result?.body?.rows?.[0]?.row ?? [];
      for (const r of rows) {
        const address = r.rdnWhlAddr || r.siteWhlAddr || "";
        if (!address.includes(area) || r.trdStateGbn !== "01" || !r.apvPermYmd) continue;
        if (r.apvPermYmd.replaceAll("-", "") < compact(begin)) continue;
        const name = r.bplcNm ?? "(이름 없음)";
        const category = r.uptaeNm || svc.label;
        found.push({
          name,
          category,
          address,
          openedOn: dashed(r.apvPermYmd),
          competitor: store.competitorTerms.some((t) => name.includes(t) || category.includes(t)),
        });
      }
    }
    found.sort((a, b) => b.openedOn.localeCompare(a.openedOn));
    return { mode: "live", data: found, note: `${area} 최근 30일 인허가 기준` };
  } catch (err) {
    return { mode: "error", data: demoOpenings(), note: `인허가 API 오류: ${message(err)}` };
  }
}
