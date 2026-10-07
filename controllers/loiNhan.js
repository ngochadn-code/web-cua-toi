// ==============================================
// XỬ LÝ LOGIC LỜI NHẮN
// ==============================================
const fs = require("fs");
const path = require("path");
const { dinhDangNgay, taoId, kiemTraThongTin } = require("../utils/hoTro");

// Đường dẫn file dữ liệu
const DU_LIEU = path.join(__dirname, "../data/loinhan.json");

// Đọc dữ liệu từ file
const docDanhSach = () => {
  try {
    if (!fs.existsSync(DU_LIEU)) return [];
    const noiDung = fs.readFileSync(DU_LIEU, "utf8");
    return JSON.parse(noiDung);
  } catch (loi) {
    console.error("❌ Lỗi đọc dữ liệu:", loi.message);
    return [];
  }
};

// Ghi dữ liệu vào file
const luuDanhSach = (danhSach) => {
  try {
    fs.writeFileSync(DU_LIEU, JSON.stringify(danhSach, null, 2));
    return true;
  } catch (loi) {
    console.error("❌ Lỗi lưu dữ liệu:", loi.message);
    return false;
  }
};

// Thêm lời nhắn mới
const themLoiNhanMoi = (ten, email, noiDung) => {
  // Kiểm tra trước khi thêm
  const danhSachLoi = kiemTraThongTin(ten, email, noiDung);
  if (danhSachLoi.length > 0) {
    return { thanhCong: false, loi: danhSachLoi };
  }

  const danhSach = docDanhSach();
  const loiNhanMoi = {
    id: taoId(),
    ten,
    email,
    noiDung,
    ngayGui: dinhDangNgay(),
    daDoc: false
  };

  danhSach.unshift(loiNhanMoi);
  luuDanhSach(danhSach);

  return { thanhCong: true, duLieu: loiNhanMoi };
};

// Đánh dấu đã đọc
const danhDauDaDoc = (id) => {
  const danhSach = docDanhSach();
  const phanTu = danhSach.find(item => item.id === id);
  if (phanTu) {
    phanTu.daDoc = true;
    luuDanhSach(danhSach);
    return true;
  }
  return false;
};

module.exports = {
  docDanhSach,
  themLoiNhanMoi,
  danhDauDaDoc
};