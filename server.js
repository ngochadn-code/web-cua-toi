require("dotenv").config();
// ==============================================
// SERVER — TỐI ƯU & MỞ RỘNG
// ==============================================
const express = require("express");
const path = require("path");
const fs = require("fs");
const { docDanhSach, themLoiNhanMoi, danhDauDaDoc } = require("./controllers/loiNhan");

const ungDung = express();

// Cấu hình
const MAT_KHAU_QUAN_LY = process.env.MAT_KHAU_QUAN_LY || "123456";
const PORT = process.env.PORT || 3000;
ungDung.use(express.json());
ungDung.use(express.urlencoded({ extended: true }));
ungDung.use(express.static(path.join(__dirname, "public")));

// Ghi nhật ký
const ghiNhatKy = (hanhDong, thongTin = "") => {
  const ngay = new Date().toLocaleString("vi-VN");
  const dong = `[${ngay}] ${hanhDong} — ${thongTin}\n`;
  console.log(dong.trim());
  fs.appendFileSync("./nhatky.txt", dong, { flag: "a" });
};

// Kiểm tra đăng nhập
const daDangNhap = (req) => req.headers.cookie?.includes("da_dang_nhap=true");

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
      res.redirect(`/?loi=${encodeURIComponent(ketQua.loi.join("; "))}`);
    }
  } catch {
    res.redirect("/?loi=Hệ thống bận, thử lại sau");
  }
});

// ================= TRANG QUẢN LÝ =================
ungDung.get("/danhsach", (req, res) => {
  if (daDangNhap(req)) {
    return res.sendFile(path.join(__dirname, "public", "quanly.html"));
  }
  // Form đăng nhập
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đăng nhập quản lý</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;background:linear-gradient(135deg,#1e3a8a,#3b82f6)}
        .hop{background:white;padding:30px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);width:90%;max-width:380px}
        h2{text-align:center;color:#1e3a8a;margin-bottom:25px}
        input{width:100%;padding:14px;margin:8px 0;border:2px solid #e5e7eb;border-radius:10px;font-size:16px}
        input:focus{outline:none;border-color:#3b82f6}
        button{width:100%;padding:14px;background:#2563eb;color:white;border:none;border-radius:10px;font-size:16px;font-weight:bold;cursor:pointer;margin-top:8px}
        button:hover{background:#1d4ed8}
        .loi{color:#dc2626;margin-top:15px;text-align:center;display:${req.query.loi ? "block" : "none"}}
      </style>
    </head>
    <body>
      <div class="hop">
        <h2>🔐 Đăng nhập quản lý</h2>
        <form method="POST">
          <input type="password" name="mat_khau" placeholder="Nhập mật khẩu..." required>
          <button>Đăng nhập</button>
          <div class="loi">❌ Mật khẩu sai, thử lại</div>
        </form>
      </div>
    </body>
    </html>
  `);
});

ungDung.post("/danhsach", (req, res) => {
  if (req.body.mat_khau === MAT_KHAU_QUAN_LY) {
    res.cookie("da_dang_nhap", "true", { maxAge: 86400000, httpOnly: true });
    ghiNhatKy("ĐĂNG NHẬP", "Thành công");
    res.redirect("/danhsach");
  } else {
    ghiNhatKy("ĐĂNG NHẬP THẤT BẠI", "Sai mật khẩu");
    res.redirect("/danhsach?loi=1");
  }
});

// ================= API DỮ LIỆU — TÌM KIẾM & LỌC =================
ungDung.get("/api/danhsach", (req, res) => {
  if (!daDangNhap(req)) return res.json({ loi: "Khong co quyen" });

  try {
    const { tim, loc } = req.query;
    let danhSach = docDanhSach();

    // Tìm kiếm
    if (tim) {
      const tuKhoa = tim.toLowerCase();
      danhSach = danhSach.filter(i =>
        i.ten.toLowerCase().includes(tuKhoa) ||
        i.email.toLowerCase().includes(tuKhoa) ||
        i.noiDung.toLowerCase().includes(tuKhoa)
      );
    }

    // Lọc: chua-doc / da-doc
    if (loc === "chua-doc") danhSach = danhSach.filter(i => !i.daDoc);
    if (loc === "da-doc") danhSach = danhSach.filter(i => i.daDoc);

    res.json({
      tong: docDanhSach().length,
      hienThi: danhSach.length,
      chuaDoc: docDanhSach().filter(i => !i.daDoc).length,
      daDoc: docDanhSach().filter(i => i.daDoc).length,
      duLieu: danhSach
    });
  } catch {
    res.json({ loi: "Lỗi hệ thống" });
  }
});

// ================= ĐÁNH DẤU ĐÃ ĐỌC =================
ungDung.get("/danhsach/da-doc", (req, res) => {
  if (!daDangNhap(req)) return res.json({ thanhCong: false });
  try {
    danhDauDaDoc(req.query.id);
    ghiNhatKy("ĐÁNH DẤU", `ID: ${req.query.id}`);
    res.json({ thanhCong: true });
  } catch {
    res.json({ thanhCong: false });
  }
});

// ================= XUẤT DỮ LIỆU CSV =================
ungDung.get("/api/xuat-csv", (req, res) => {
  if (!daDangNhap(req)) return res.send("Không có quyền");
  const ds = docDanhSach();
  const csv = "Tên,Email,Nội dung,Ngày,Trạng thái\n" +
    ds.map(i => `"${i.ten}","${i.email}","${i.noiDung.replace(/"/g, '""')}","${i.ngayGui}","${i.daDoc ? "Đã đọc" : "Chưa đọc"}"`).join("\n");
  res.setHeader("Content-Disposition", "attachment; filename=loi-nhan.csv");
  res.type("text/csv").send(csv);
});

// ================= THỐNG KÊ CHO BIỂU ĐỒ =================
ungDung.get("/api/thongke", (req, res) => {
  if (!daDangNhap(req)) return res.json({ loi: "Khong co quyen" });
  const ds = docDanhSach();
  res.json({
    tong: ds.length,
    chuaDoc: ds.filter(i => !i.daDoc).length,
    daDoc: ds.filter(i => i.daDoc).length,
    // Nhóm theo ngày
    theoNgay: ds.reduce((acc, i) => {
      const ngay = i.ngayGui.split(" ")[0];
      acc[ngay] = (acc[ngay] || 0) + 1;
      return acc;
    }, {})
  });
});

// Khởi động
ungDung.listen(PORT, () => {
  console.log("=".repeat(55));
  console.log("✅ SERVER — Tối ưu & Mở rộng");
  console.log(`📍 http://localhost:${PORT}`);
  console.log("=".repeat(55));
});