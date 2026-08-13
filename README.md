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

## Theo dõi truy vấn database

App chỉ ghi log tại đúng vị trí một MongoDB operation thực sự được thực thi. Theo dõi terminal đang chạy `npm run dev` hoặc log của deployment:

```text
[MongoDB] EXECUTE {
  database: 'phenikaa_demo',
  collection: 'items',
  operation: 'findOne',
  filter: { id: '...' }
}
```

Cách đọc:

- Có request RSC và có `[MongoDB] EXECUTE`: request đó thực sự truy cập MongoDB.
- Có request RSC nhưng không có `[MongoDB] EXECUTE`: server trả dữ liệu từ Data Cache.
- Không có request RSC và không có `[MongoDB] EXECUTE`: trình duyệt dùng Client Router Cache.
- Đổi `?q=` không tạo MongoDB log: search đang lọc trên danh sách gốc từ `getItems()`, không query database theo từ khóa.

Các log `createIndex` và `estimatedDocumentCount` chỉ xuất hiện khi tiến trình server thiết lập collection lần đầu.

### Cache Debug panel

Panel ở góc phải dưới theo dõi các thao tác điều hướng, search và CRUD:

- `CLIENT ROUTER CACHE`: điều hướng không gửi RSC request.
- `SERVER DATA CACHE`: có RSC request nhưng server không query MongoDB.
- `MONGODB QUERY`: thao tác đọc/ghi thực thi MongoDB.
- `NO DATABASE`: validation thất bại trước khi gọi database hoặc không có bản ghi cần thay đổi.
- `DATABASE ERROR`: thao tác đã gọi database nhưng thất bại.

Create, update và delete hiển thị kết quả Server Action. Search debounce 350ms, đẩy từ khóa vào `?q=` và query MongoDB cho từ khóa mới. Tìm lại cùng từ khóa có thể dùng Server Data Cache cho cache key riêng của từ khóa đó.

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
