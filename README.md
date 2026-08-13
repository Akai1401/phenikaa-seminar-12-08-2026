# Phenikaa Next.js CRUD Demo

Demo CRUD cơ bản bằng Next.js App Router, Server Actions, shadcn/ui, server-side cache và client Router Cache.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`.

## Database

App dùng MongoDB Atlas cho cả local và production. App đọc connection string từ:

```bash
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/phenikaa_demo?retryWrites=true&w=majority"
MONGODB_DB="phenikaa_demo"
```

`MONGODB_DB` là optional, mặc định là `phenikaa_demo`.

Khi chạy lần đầu, app tự tạo collection `items`, tạo unique index theo `id`, và seed dữ liệu mẫu nếu collection đang trống.

### Vercel + MongoDB Atlas

1. Trong Vercel project, mở Integrations và kết nối MongoDB Atlas.
2. Chọn cluster/database cần dùng cho project.
3. Đảm bảo Vercel đã thêm `MONGODB_URI` vào Project Settings → Environment Variables.
4. Pull env về local nếu muốn dùng cùng Atlas DB: `vercel env pull .env.local`.
5. Redeploy app.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```
