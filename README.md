# 더늘봄 가게 관리 대시보드

캐시노트에서 필요한 기능만 모은 웹 대시보드입니다. 아이패드 사파리에서 열고 **공유 → 홈 화면에 추가**를 누르면 앱처럼 쓸 수 있습니다.

| 기능 | 데이터 출처 | 상태 |
|---|---|---|
| 검색순위 | 네이버 검색 API (지역검색, 상위 5위까지) | 키 입력 시 실시간 |
| 키워드 검색량 | 네이버 검색광고 API | 키 입력 시 실시간 |
| 리뷰 | 구글 지도 Places API | 키 입력 시 실시간 (네이버·배달앱은 공식 API 없음) |
| 인스타그램 | Instagram Graph API 해시태그 검색 | 키 입력 시 실시간 |
| 주변 개업 | 지방행정 인허가 데이터 (LOCALDATA) | 키 입력 시 실시간 |
| 매출·입금 / 계좌 / 세금 | CODEF | 샘플 (CODEF 계약 후 연결) |
| 포스 | 포스사별 API | 샘플 (사용 중인 포스사 확인 필요) |
| 매일 리포트 | 위 데이터 요약 → 텔레그램 | 봇 토큰 입력 시 매일 22시 발송 |

키가 없는 항목은 **샘플** 배지와 함께 예시 데이터가 표시되고, 키를 넣으면 **실시간**으로 바뀝니다.

## 설정

`.env.example`을 `.env.local`로 복사해서 값을 채우거나, Vercel 프로젝트의 Environment Variables에 같은 이름으로 넣습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

- `GET /api/report` — 전체 데이터와 요약 문장(JSON)
- `GET /api/notify` — 텔레그램 발송 (`Authorization: Bearer $CRON_SECRET` 필요, `vercel.json` cron이 매일 호출)
