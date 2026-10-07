// ==============================================
// SERVER — BẢO MẬT & XỬ LÝ LỖI
// ==============================================
const express = require("express");
const path = require("path");
const fs = require("fs");
const { docDanhSach, themLoiNhanMoi, danhDauDaDoc } = require("./controllers/loiNhan");

const ungDung = express();
const PORT = process.env.PORT || 3000;

// ================= CẤU HÌNH BẢO MẬT =================
// Mật khẩu — nên lưu ở biến môi trường khi lên sản phẩm
const MAT_KHAU_QUAN_LY = "123456"; // Đổi thành mật khẩu của bạn!
const KHOA_BI_MAT = "khoa-bi-mat-cua-ban-12345"; // Tùy ý viết gì cũng được

// Thư viện ký cookie an toàn
ungDung.use(express.json());
ungDung.use(express.urlencoded({ extended: true }));
ungDung.use(express.static(path.join(__dirname, "public")));

// Ghi nhật ký hoạt động
const ghiNhatKy = (hanhDong, thongTin = "") => {
  const ngay = new Date().toLocaleString("vi-VN");
  const dong = `[${ngay}] ${hanhDong} — ${thongTin}\n`;
  console.log(dong.trim());
  fs.appendFileSync("./nhatky.txt", dong, { flag: "a" });
};

// ================= TRANG CHÍNH =================
ungDung.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= GỬI LỜI NHẮN =================
ungDung.post("/gui-loi-nhan", (req, res) => {
  try {
    const { ten, email, noiDung } = req.body;
    const ketQua = themLoiNhanMoi(ten, email, noiDung);

    if (ketQua.thanhCong) {
      ghiNhatKy("GỬI LỜI NHẮN", `Tên: ${ten}`);
      res.redirect("/?thongbao=gui-thanh-cong");
    } else {
      ghiNhatKy("THẤT BẠI — Gửi lời nhắn", `Lỗi: ${ketQua.loi.join("; ")}`);
      res.redirect(`/?loi=${encodeURIComponent(ketQua.loi.join("; "))}`);
    }
  } catch (loi) {
    ghiNhatKy("LỖI HỆ THỐNG", loi.message);
    res.redirect("/?loi=Hệ thống bận, vui lòng thử lại sau");
  }
});

// ================= TRANG ĐĂNG NHẬP QUẢN LÝ =================
ungDung.get("/danhsach", (req, res) => {
  // Kiểm tra đã đăng nhập chưa qua Cookie
  const daDangNhap = req.headers.cookie?.includes("da_dang_nhap=true");
  
  if (daDangNhap) {
    return res.sendFile(path.join(__dirname, "public", "quanly.html"));
  }
  
  // Chưa đăng nhập → hiện form đăng nhập
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Đăng nhập quản lý</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg,#1e3a8a,#3b82f6); margin:0; }
        .hop { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); width: 100%; max-width: 360px; }
        h2 { text-align: center; color: #1e3a8a; margin-bottom: 20px; }
        input { width: 100%; padding: 12px; margin: 8px 0; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; }
        input:focus { outline: none; border-color: #3b82f6; }
        button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        button:hover { background: #1d4ed8; }
        .loi { color: #dc2626; margin-top: 10px; text-align: center; display: ${req.query.loi ? "block" : "none"}; }
      </style>
    </head>
    <body>
      <div class="hop">
        <h2>🔐 Đăng nhập quản lý</h2>
        <form method="POST" action="/danhsach">
          <input type="password" name="mat_khau" placeholder="Nhập mật khẩu quản lý..." required>
          <button type="submit">Đăng nhập</button>
          <div class="loi">Mật khẩu sai! Vui lòng thử lại</div>
        </form>
      </div>
    </body>
    </html>
  `);
});

// ================= XỬ LÝ ĐĂNG NHẬP =================
ungDung.post("/danhsach", (req, res) => {
  const { mat_khau } = req.body;
  
  if (mat_khau === MAT_KHAU_QUAN_LY) {
    // Đặt Cookie đăng nhập — tự động ghi nhớ 1 ngày
    res.cookie("da_dang_nhap", "true", { maxAge: 86400000, httpOnly: true });
    ghiNhatKy("ĐĂNG NHẬP", "Thành công");
    res.redirect("/danhsach");
  } else {
    ghiNhatKy("ĐĂNG NHẬP THẤT BẠI", "Mật khẩu sai");
    res.redirect("/danhsach?loi=1");
  }
});

// ================= API DỮ LIỆU — KIỂM TRA QUYỀN =================
ungDung.get("/api/danhsach", (req, res) => {
  const daDangNhap = req.headers.cookie?.includes("da_dang_nhap=true");
  if (!daDangNhap) {
    ghiNhatKy("TRUY CẬP BỊ TỪ CHỐI", "/api/danhsach");
    return res.json({ loi: "Khong co quyen" });
  }
  
  try {
    const danhSach = docDanhSach();
    res.json({
      tong: danhSach.length,
      chuaDoc: danhSach.filter(i => !i.daDoc).length,
      daDoc: danhSach.filter(i => i.daDoc).length,
      duLieu: danhSach
    });
  } catch (loi) {
    ghiNhatKy("LỖI API", loi.message);
    res.json({ loi: "Loi he thong" });
  }
});

// ================= ĐÁNH DẤU ĐÃ ĐỌC =================
ungDung.get("/danhsach/da-doc", (req, res) => {
  const daDangNhap = req.headers.cookie?.includes("da_dang_nhap=true");
  if (!daDangNhap) {
    return res.json({ thanhCong: false });
  }
  
  try {
    const { id } = req.query;
    if (!id) {
      return res.json({ thanhCong: false });
    }
    
    danhDauDaDoc(id);
    ghiNhatKy("ĐÁNH DẤU ĐÃ ĐỌC", `ID: ${id}`);
    res.json({ thanhCong: true });
  } catch (loi) {
    ghiNhatKy("LỖI ĐÁNH DẤU", loi.message);
    res.json({ thanhCong: false });
  }
});

// ================= KHỞI ĐỘNG =================
ungDung.listen(PORT, () => {
  console.log("=".repeat(55));
  console.log("✅ SERVER ĐÃ CHẠY — Bảo mật & Nhật ký");
  console.log(`📍 Trang chủ: http://localhost:${PORT}`);
  console.log(`🔐 Quản lý: http://localhost:${PORT}/danhsach`);
  console.log("=".repeat(55));
});