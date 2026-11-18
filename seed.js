const personnel = [
  { id: 1, name: "Nguyễn Văn A", title: "Giám đốc" },
  { id: 2, name: "Trần Thị B", title: "Phó Giám đốc" },
  { id: 3, name: "Lê Văn C", title: "Nhân viên kinh doanh – Miền Bắc" },
  { id: 4, name: "Phạm Thị D", title: "Nhân viên kinh doanh – Miền Bắc / Mua hàng" },
  { id: 5, name: "Hoàng Văn E", title: "Presales / Kỹ thuật" },
  { id: 6, name: "Vũ Thị F", title: "Kế toán trưởng – Bán thời gian" },
  { id: 7, name: "Đặng Văn G", title: "Nhân viên kinh doanh – Miền Nam / Khoán" },
  { id: 8, name: "Thuê ngoài", title: "Đơn vị Marketing" },
];

const kpiPool = {};
let kid = 0;
const kpis = [];
function kpi(name) {
  if (!name || !name.trim()) return null;
  const n = name.trim();
  if (kpiPool[n]) return kpiPool[n];
  const id = ++kid;
  kpiPool[n] = id;
  kpis.push({ id, name: n });
  return id;
}

let tid = 0;
const t = (name, k1, k2, k3) => ({
  id: ++tid,
  name,
  kpiIds: [kpi(k1), kpi(k2), kpi(k3)].filter((x) => x != null),
});

const tasks = [
  t("Chiến lược & hiệu quả công ty", "Lợi nhuận gộp", "Chi phí quản lý / lợi nhuận gộp", "Dòng tiền từ hoạt động kinh doanh"),
  t("Quản lý đối tác", "Lợi nhuận gộp từ đối tác", "Chiết khấu/hoàn tiền từ đối tác", "Doanh số đạt bậc giá"),
  t("Phát triển khách hàng chiến lược", "Giá trị lợi nhuận gộp từ khách hàng chiến lược", "Tỷ lệ thắng", "Giá trị cơ hội đang phát triển"),
  t("Phát triển khách hàng lớn", "Giá trị lợi nhuận gộp từ khách hàng lớn", "Tỷ lệ thắng", "Giá trị cơ hội đang phát triển"),
  t("Phát triển khách hàng hiện hữu", "Doanh thu/khách hàng", "Lợi nhuận gộp/khách hàng", "Tỷ lệ doanh thu mở rộng"),
  t("Triển khai dự án", "Tỷ lệ dự án đúng hạn", "Biên lợi nhuận dự án", "Tỷ lệ nghiệm thu đúng hạn"),
  t("Kinh doanh khách hàng mới", "Giá trị cơ hội mới", "Tỷ lệ thắng", "Lợi nhuận gộp từ khách hàng mới"),
  t("Kinh doanh đấu thầu", "Giá trị dự thầu", "Tỷ lệ trúng thầu", "Lợi nhuận gộp từ đấu thầu"),
  t("Quản lý khách hàng", "Doanh thu", "Lợi nhuận gộp", "Doanh thu mua lại/mở rộng"),
  t("Kinh doanh & quản lý khách hàng", "Giá trị cơ hội", "Tỷ lệ thắng", "Lợi nhuận gộp"),
  t("Mua hàng", "Tiết kiệm giá mua", "Tỷ lệ giao hàng đúng hạn", "Thời gian mua hàng"),
  t("Nhân sự & hành chính", "Thời gian tuyển dụng", "Tỷ lệ nghỉ việc", "Chi phí hành chính/người"),
  t("Tư vấn giải pháp", "Tỷ lệ thắng kỹ thuật", "Tỷ lệ hồ sơ đúng hạn", "Lợi nhuận gộp / giờ tư vấn"),
  t("Phần mềm & AI", "Tỷ lệ hoàn thành đúng hạn", "Tỷ lệ lỗi", "Giờ công tiết kiệm / giá trị tạo ra"),
  t("Vận hành CNTT", "Tỷ lệ hoạt động ổn định", "Thời gian xử lý sự cố", "Chi phí CNTT/người dùng"),
  t("Kiểm soát tài chính", "Độ chính xác dự báo", "Chi phí hoạt động/doanh thu", "Dòng tiền hoạt động"),
  t("Kế toán & thuế", "Thời gian khóa sổ", "Tỷ lệ sai sót kế toán", "Tỷ lệ tuân thủ thuế"),
  t("Thu hồi công nợ", "Số ngày thu tiền bình quân", "Công nợ quá hạn", "Tỷ lệ thu hồi"),
  t("Kinh doanh khách hàng mới (miền Nam)", "Giá trị cơ hội mới", "Tỷ lệ thắng", "Lợi nhuận gộp"),
  t("Quản lý khách hàng (miền Nam)", "Doanh thu/khách hàng", "Lợi nhuận gộp/khách hàng", "Doanh thu mở rộng"),
  t("Phát triển thị trường", "Số cơ hội đủ điều kiện", "Giá trị cơ hội mới", "Số khách hàng mới"),
  t("Tạo khách hàng tiềm năng", "Số khách hàng tiềm năng đủ điều kiện", "Chi phí/khách hàng tiềm năng", "Giá trị cơ hội tạo ra"),
];

let aid = 0;
const a = (personId, taskId) => ({ id: ++aid, personId, taskId });

const assignments = [
  a(1, 1), a(1, 2), a(1, 3),
  a(2, 4), a(2, 5), a(2, 6),
  a(3, 7), a(3, 8), a(3, 9),
  a(4, 10), a(4, 11), a(4, 12),
  a(5, 13), a(5, 14), a(5, 15),
  a(6, 16), a(6, 17), a(6, 18),
  a(7, 19), a(7, 20), a(7, 21),
  a(8, 22),
];

const seed = {
  nextId: 100,
  personnel,
  kpis,
  tasks,
  assignments,
};

module.exports = { seed };
