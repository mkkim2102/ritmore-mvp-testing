# ritmore MVP 스토어

리트모어의 상품, 상세 이미지, 구매 안내를 제공하는 정적 Next.js 사이트입니다. 장바구니는 브라우저에 저장되며, 금액은 `src/lib/bundles.ts`의 공개 가격으로 계산합니다. 출시 전이라 주문과 결제는 받지 않습니다.

## 로컬 실행

Node.js 24에서 `npm ci` 후 `npm run dev`를 실행하면 [스토어](http://127.0.0.1:43117)를 열 수 있습니다. `npm run build`는 `out/`에 정적 파일을 생성합니다.

## Cloudflare Pages

- GitHub 저장소 `mkkim2102/ritmore-mvp-testing`의 `main`
- 프레임워크 사전 설정 `Next.js (Static HTML Export)` 또는 `None`
- 빌드 명령 `npm run build`, 산출 디렉터리 `out`
- 환경 변수 `NODE_VERSION=24`, `NEXT_PUBLIC_SITE_URL=https://ritmoremint.com`
- 예전 상품·유입 주소는 `public/_redirects`에서 처리합니다.

Fly의 SQLite 백업은 사이트 소스 및 배포 산출물과 별도로 보관합니다.
