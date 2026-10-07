// ==============================================
// HÀM HỖ TRỢ DÙNG CHUNG
// ==============================================

// Lấy ngày giờ hiện tại định dạng đẹp
const dinhDangNgay = () => {
  return new Date().toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Tạo mã ID ngẫu nhiên duy nhất
const taoId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

// Kiểm tra dữ liệu hợp lệ
const kiemTraThongTin = (ten, email, noiDung) => {
  const loi = [];
  if (!ten || ten.length < 2) loi.push("Tên phải có ít nhất 2 ký tự");
  if (!email || !email.includes("@")) loi.push("Email chưa đúng định dạng");
  if (!noiDung || noiDung.length < 5) loi.push("Nội dung quá ngắn");
  return loi;
};

// Xuất ra để file khác dùng được
module.exports = {
  dinhDangNgay,
  taoId,
  kiemTraThongTin
};