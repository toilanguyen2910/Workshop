# Workshop Discovery

Giao diện khám phá workshop, **đăng nhập Google** (Firebase), **chat AI** (Gemini).

Repository: [github.com/toilanguyen2910/Workshop](https://github.com/toilanguyen2910/Workshop)

## Chạy local

```bash
npm install
```

Copy `.env.example` → `.env.local` và điền:

- **VITE_GEMINI_API_KEY** — bắt buộc để nút chat gọi được AI.
- **VITE_FIREBASE_*** — bắt buộc để nút **Đăng nhập** hoạt động.

Trong Firebase Console: Authentication → Sign-in → Google; Authorized domains: `localhost`.

```bash
npm run dev
```

## Dữ liệu workshop

Mặc định danh sách rỗng (giống màn hình mẫu). Thêm bản ghi trong [`src/data/workshops.ts`](src/data/workshops.ts) để thấy thẻ workshop sau khi lọc.

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
