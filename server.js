// ==============================================
// SERVER ƯỚC MƠ — HOÀN CHỈNH
// ==============================================

// 1. GỌI THƯ VIỆN
const express = require('express');
const mongoose = require('mongoose');

// 2. KHỞI TẠO
const ungDung = express();
const PORT = 8888;

// 3. MỞ CỬA CHO REACT (CORS)
ungDung.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

ungDung.use(express.json());

// 4. KẾT NỐI MONGODB
mongoose.connect('mongodb+srv://ngochadn68_db_user:PszceWhFPbYDcGj1@cluster0.eaex6lz.mongodb.net/?appName=Cluster0')
  .then(() => console.log('✅ Kết nối MongoDB THÀNH CÔNG!'))
  .catch(err => console.log('❌ Lỗi kết nối MongoDB:', err.message));

// 5. KHUÔN DỮ LIỆU
const uocMoSchema = new mongoose.Schema({
  noiDung: String,
  mucTien: { type: Number, default: 0 },
  hoanThanh: { type: Boolean, default: false }
});
const UocMo = mongoose.model('UocMo', uocMoSchema);

// 6. API — CÁC CHỨC NĂNG
// Trang kiểm tra
ungDung.get('/', (req, res) => {
  res.send('✅ Server ĐANG CHẠY — MongoDB sẵn sàng! 🚀');
});

// Lấy danh sách
ungDung.get('/api/uoc-mo', async (req, res) => {
  try {
    const danhSach = await UocMo.find().sort({ _id: -1 });
    res.json(danhSach);
  } catch (loi) {
    res.status(500).json({ loi: 'Lỗi lấy dữ liệu' });
  }
});

// Thêm mới
ungDung.post('/api/uoc-mo', async (req, res) => {
  try {
    const uocMoi = new UocMo({
      noiDung: req.body.noiDung,
      mucTien: req.body.mucTien || 0
    });
    await uocMoi.save();
    res.json(uocMoi);
  } catch (loi) {
    res.status(500).json({ loi: 'Lỗi thêm dữ liệu' });
  }
});

// Đánh dấu hoàn thành
ungDung.put('/api/uoc-mo/:id', async (req, res) => {
  try {
    const capNhat = await UocMo.findByIdAndUpdate(
      req.params.id,
      { hoanThanh: req.body.hoanThanh },
      { new: true }
    );
    res.json(capNhat);
  } catch (loi) {
    res.status(500).json({ loi: 'Lỗi cập nhật' });
  }
});

// Xóa
ungDung.delete('/api/uoc-mo/:id', async (req, res) => {
  try {
    await UocMo.findByIdAndDelete(req.params.id);
    res.json({ thongBao: 'Đã xóa thành công' });
  } catch (loi) {
    res.status(500).json({ loi: 'Lỗi xóa' });
  }
});

// 7. CHẠY SERVER
ungDung.listen(PORT, () => {
  console.log('=====================================');
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
  console.log(`📡 Sẵn sàng nhận yêu cầu từ React!`);
  console.log('=====================================');
});