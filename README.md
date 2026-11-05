# ritmore MVP 테스트 스토어

리트모어 상품 화면과 구매 흐름을 시험하는 Next.js 앱입니다. 실험 데이터는 로컬 SQLite 파일에 저장됩니다.

## 실행

Node.js 24 기준입니다.

```bash
npm ci
npm run dev
```

브라우저에서 [테스트 스토어](http://127.0.0.1:43117)를 엽니다.

[운영 화면](http://127.0.0.1:43117/dashboard)을 사용하려면 `.env.example`을 `.env.local`로 복사한 뒤 `DASHBOARD_PASSWORD`와 `AUTH_SECRET`을 설정합니다. 세션 서명 키는 `openssl rand -hex 32`로 생성할 수 있습니다.
