// ==============================================
// KẾT NỐI CSDL — ĐỌC TỪ BIẾN MÔI TRƯỜNG
// ==============================================
require("dotenv").config(); // Tải file .env
const mongoose = require("mongoose");

const CHUOI_KET_NOI = process.env.MONGO_URI;

if (!CHUOI_KET_NOI) {
  console.error("❌ Chưa đặt biến MONGO_URI trong file .env!");
  process.exit(1); // Dừng chương trình
}

const ketNoi = async () => {
  try {
    await mongoose.connect(CHUOI_KET_NOI);
    console.log("✅ Kết nối MongoDB thành công!");
  } catch (loi) {
    console.error("❌ Lỗi kết nối CSDL:", loi.message);
    console.log("🔄 Thử lại sau 5 giây...");
    setTimeout(ketNoi, 5000);
  }
};

module.exports = ketNoi;