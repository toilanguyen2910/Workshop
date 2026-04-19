# Workshop Discovery

**Repository:** [https://github.com/toilanguyen2910/Workshop](https://github.com/toilanguyen2910/Workshop) (`git clone https://github.com/toilanguyen2910/Workshop.git`)

Ứng dụng web React (Vite) để xem workshop, đặt chỗ, đánh giá, quản trị nội dung và chatbot hỗ trợ (Gemini). Đăng nhập qua **Google** (Firebase Authentication).

**GitHub Pages (sau khi deploy):** [https://toilanguyen2910.github.io/Workshop/](https://toilanguyen2910.github.io/Workshop/)

## Chạy local

**Yêu cầu:** Node.js 18+

1. Cài dependency: `npm install`
2. Tạo file `.env.local` (hoặc `.env`) trong thư mục gốc:
   - `GEMINI_API_KEY` — API key cho chatbot (bắt buộc nếu dùng chatbot)
   - `VITE_ADMIN_EMAIL` — email Google của tài khoản quản trị viên (khớp với user đăng nhập)
3. Chạy dev server: `npm run dev`  
   Mở trình duyệt tại đường dẫn có base `/Workshop/` (Vite sẽ phục vụ app dưới base đó).

## Firebase

- File cấu hình client: `firebase-applet-config.json` (đã có trong repo; API key Firebase là public theo thiết kế SDK, quan trọng là **Firestore Security Rules**).
- **Authentication → Sign-in method:** bật Google.
- **Authentication → Settings → Authorized domains:** thêm:
  - `localhost`
  - `toilanguyen2910.github.io`
- **Firestore:** triển khai rules từ [firestore.rules](firestore.rules) (`firebase deploy --only firestore:rules` nếu dùng Firebase CLI).  
  Nếu đổi email admin, cập nhật cả `VITE_ADMIN_EMAIL` và các điều kiện trong `firestore.rules` cho khớp.

## Build và deploy GitHub Pages

```bash
npm run build
npm run deploy
```

- `build` chạy Vite và sao chép `dist/index.html` → `dist/404.html` để route SPA hoạt động khi tải trực tiếp URL con.
- `deploy` đẩy thư mục `dist` lên branch `gh-pages` (package [gh-pages](https://www.npmjs.com/package/gh-pages)).

Trên GitHub: **Settings → Pages** → nguồn: branch **gh-pages**, thư mục **/ (root)**.

## Scripts

| Lệnh            | Mô tả                          |
|-----------------|--------------------------------|
| `npm run dev`   | Dev server                     |
| `npm run build` | Build production + SPA 404     |
| `npm run deploy`| `predeploy` → build → gh-pages |
| `npm run lint`  | `tsc --noEmit`                 |
