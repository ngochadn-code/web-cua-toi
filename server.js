// ==============================================
// SERVER CHÍNH — HOÀN CHỈNH
// ==============================================
const express = require("express");
const path = require("path");
const { docDanhSach, themLoiNhanMoi, danhDauDaDoc } = require("./controllers/loiNhan");

// Tạo máy chủ — NẾU THIẾU DÒNG NÀY SẼ BÁO LỖI! ⚠️
const ungDung = express();

const PORT = process.env.PORT || 3000;
const MAT_KHAU_QUAN_LY = "123456"; // Đổi mật khẩu thành của bạn!

// Cấu hình
ungDung.use(express.static(path.join(__dirname, "public")));
ungDung.use(express.urlencoded({ extended: true }));
ungDung.use(express.json());

// ========== TRANG CHÍNH ==========
ungDung.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ========== GỬI LỜI NHẮN ==========
ungDung.post("/gui-loi-nhan", (req, res) => {
  const { ten, email, noiDung } = req.body;
  const ketQua = themLoiNhanMoi(ten, email, noiDung);

  if (ketQua.thanhCong) {
    res.redirect("/?thongbao=gui-thanh-cong");
  } else {
    res.redirect(`/?loi=${encodeURIComponent(ketQua.loi.join("; "))}`);
  }
});

// ========== TRANG QUẢN LÝ ==========
ungDung.get("/danhsach", (req, res) => {
  const { mk } = req.query;
  if (mk !== MAT_KHAU_QUAN_LY) {
    return res.send("🔒 Truy cập bị từ chối — Thiếu mật khẩu!");
  }
  res.sendFile(path.join(__dirname, "public", "quanly.html"));
});

// ========== API TRẢ DỮ LIỆU ==========
ungDung.get("/api/danhsach", (req, res) => {
  const { mk } = req.query;
  if (mk !== MAT_KHAU_QUAN_LY) {
    return res.json({ loi: "Khong co quyen" });
  }
  const danhSach = docDanhSach();
  res.json({
    tong: danhSach.length,
    chuaDoc: danhSach.filter(i => !i.daDoc).length,
    daDoc: danhSach.filter(i => i.daDoc).length,
    duLieu: danhSach
  });
});

// ========== ĐÁNH DẤU ĐÃ ĐỌC ==========
ungDung.get("/danhsach/da-doc", (req, res) => {
  const { mk, id } = req.query;
  if (mk === MAT_KHAU_QUAN_LY && id) {
    danhDauDaDoc(id);
    res.json({ thanhCong: true });
    return;
  }
  res.json({ thanhCong: false });
});

// Khởi động server
ungDung.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("✅ SERVER ĐÃ CHẠY — Hoàn chỉnh!");
  console.log(`📍 Trang chủ: http://localhost:${PORT}`);
  console.log(`🔐 Quản lý: http://localhost:${PORT}/danhsach?mk=${MAT_KHAU_QUAN_LY}`);
  console.log("=".repeat(50));
});