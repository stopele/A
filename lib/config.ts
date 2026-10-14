// 법인과 매장 정보. 매장 목록은 STORES_JSON 환경변수(JSON 배열)로 통째로 바꿀 수 있다.
export type PosVendor = "okpos" | "tosspos" | "none";

export interface Store {
  id: string; // 주소에 쓰이는 영문 이름
  name: string; // 화면에 보이는 이름
  category: string;
  pos: PosVendor;
  eventSales?: boolean; // 포스 대신 행사별 매출을 직접 입력 (웨딩·연회)
  region: string; // 매장 지역 (구글 지도에서 매장 찾을 때 사용)
  keywords: string[]; // 네이버 검색순위 추적 키워드
  aliases?: string[]; // 네이버·구글에 등록된 다른 상호 표기
  hashtags: string[]; // 인스타그램 해시태그 (# 제외)
  sampleMenu: string[]; // 샘플 데이터용 대표 메뉴
  scale: number; // 샘플 데이터 매출 규모
}

export const company = {
  name: process.env.COMPANY_NAME ?? "(주)더늘봄",
};

const REGION = "경기도 남양주시 진접읍";

const DEFAULT_STORES: Store[] = [
  {
    id: "galbi",
    name: "더늘봄 석갈비",
    category: "석갈비 전문점",
    pos: "okpos",
    region: REGION,
    keywords: ["진접 석갈비", "진접 갈비", "진접 맛집"],
    aliases: ["더늘봄석갈비"],
    hashtags: ["더늘봄석갈비", "진접석갈비"],
    sampleMenu: ["석갈비 정식", "돼지 석갈비", "소 석갈비", "물냉면", "된장찌개", "음료/주류"],
    scale: 1.3,
  },
  {
    id: "ssam",
    name: "쌈앤샤브",
    category: "샤브샤브",
    pos: "okpos",
    region: REGION,
    keywords: ["진접읍 샤브샤브", "진접 샤브샤브", "진접 무한리필"],
    aliases: ["쌈앤샤브 진접점"],
    hashtags: ["쌈앤샤브", "진접샤브샤브"],
    sampleMenu: ["샤브샤브 무한리필", "소고기 추가", "칼국수 사리", "죽 세트", "어린이 메뉴", "음료/주류"],
    scale: 1,
  },
  {
    id: "momento",
    name: "모멘토베이크",
    category: "베이커리 카페",
    pos: "okpos",
    region: REGION,
    keywords: ["진접 베이커리", "진접 빵집", "진접 카페"],
    hashtags: ["모멘토베이크", "진접빵집"],
    sampleMenu: ["소금빵", "크루아상", "아메리카노", "카페라떼", "바게트", "케이크"],
    scale: 0.6,
  },
  {
    id: "wedding",
    name: "웨딩하우스",
    category: "웨딩·연회",
    pos: "none",
    eventSales: true,
    region: REGION,
    keywords: ["남양주 웨딩홀", "진접 웨딩홀", "남양주 돌잔치"],
    hashtags: ["웨딩하우스", "남양주웨딩홀"],
    sampleMenu: [],
    scale: 2.2,
  },
  {
    id: "dosi",
    name: "도시곳간",
    category: "한식",
    pos: "tosspos",
    region: REGION,
    keywords: ["진접 한식", "진접 밥집", "진접 점심"],
    hashtags: ["도시곳간", "진접밥집"],
    sampleMenu: ["곳간 정식", "제육볶음", "된장찌개", "김치찌개", "솥밥", "음료/주류"],
    scale: 0.8,
  },
];

function loadStores(): Store[] {
  const raw = process.env.STORES_JSON;
  if (!raw) return DEFAULT_STORES;
  try {
    return JSON.parse(raw) as Store[];
  } catch {
    console.error("STORES_JSON 형식 오류 — 기본 매장 목록을 사용합니다.");
    return DEFAULT_STORES;
  }
}

export const stores = loadStores();

export const POS_LABEL: Record<PosVendor, string> = { okpos: "오케이포스", tosspos: "토스포스", none: "포스 없음" };

export function findStore(id: string): Store | undefined {
  return stores.find((s) => s.id === id);
}

// 상호명 비교용 (공백 무시, 별칭 포함)
export function isSameStore(store: Store, title: string): boolean {
  const t = title.replace(/\s/g, "");
  return [store.name, ...(store.aliases ?? [])].some((n) => t.includes(n.replace(/\s/g, "")));
}

export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}
