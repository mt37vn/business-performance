# Business Performance

Ứng dụng quản lý vai trò, nhiệm vụ và KPI nhân sự theo mô hình hiệu quả kinh doanh.

## Tính năng

- Danh sách nhân sự và chức danh.
- Danh mục nhiệm vụ, KPI và phân công nhân sự phụ trách.
- Giao diện xem nhanh ma trận người – nhiệm vụ – KPI.
- Lưu dữ liệu cục bộ bằng file JSON, không cần database server.

## Công nghệ

Node.js · Express 4 · HTML/CSS/JavaScript thuần

## Chạy local

```bash
npm install
npm start
```

Mở <http://localhost:3000>.

Lần chạy đầu tiên, ứng dụng tạo `data/db.json` từ dữ liệu mẫu trong `seed.js`.

## Cấu trúc

```
server.js        # Express server và REST API
seed.js          # Dữ liệu mẫu (nhân sự, KPI, nhiệm vụ)
data/db.json     # Dữ liệu thực tế (không commit)
public/          # Giao diện
```

## API chính

- `GET/POST /api/personnel`, `PUT/DELETE /api/personnel/:id`
- `GET/POST /api/tasks`, `PUT/DELETE /api/tasks/:id`
- `GET/POST /api/kpis`
- `GET/POST /api/assignments`

## Lưu ý

- Dữ liệu mẫu dùng tên giả; thay bằng dữ liệu thật trong giao diện khi sử dụng.
- Ứng dụng không có xác thực, chỉ nên chạy trong mạng nội bộ.
- Không commit thư mục `data/` vì có thể chứa thông tin nhân sự và KPI nội bộ.
