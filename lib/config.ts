// 매장 기본 정보. 모든 값은 환경변수로 덮어쓸 수 있다.
function list(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export const store = {
  name: process.env.STORE_NAME ?? "더늘봄",
  // 검색순위를 추적할 키워드
  keywords: list(process.env.STORE_KEYWORDS, ["진접읍 샤브샤브", "진접 샤브샤브", "진접 맛집"]),
  // 주변 개업 조회용 지역 (시군구 + 읍면동)
  region: process.env.STORE_REGION ?? "경기도 남양주시 진접읍",
  // 인스타그램에서 추적할 해시태그 (# 제외)
  hashtags: list(process.env.STORE_HASHTAGS, ["진접샤브샤브", "진접맛집"]),
  // 주변 개업 알림에서 경쟁 업종으로 볼 키워드
  competitorTerms: list(process.env.STORE_COMPETITOR_TERMS, ["샤브", "훠궈", "전골", "뷔페"]),
};

export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}
