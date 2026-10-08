const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 8888

// === CẤU HÌNH ===
app.use(cors())
app.use(express.json())

// === KẾT NỐI MONGODB ===
mongoose.connect('mongodb+srv://ngochadn68_db_user:PszceWhFPbYDcGj1@cluster0.eaex6lz.mongodb.net/?appName=Cluster0')
  .then(() => console.log('✅ Kết nối MongoDB THÀNH CÔNG!'))
  .catch(err => console.log('❌ Lỗi kết nối:', err.message))

// === MÔ HÌNH NGƯỜI DÙNG ===
const nguoiDungSchema = new mongoose.Schema({
  tenDangNhap: { type: String, required: true, unique: true },
  matKhau: { type: String, required: true },
  ngayTao: { type: Date, default: Date.now }
})
const NguoiDung = mongoose.model('NguoiDung', nguoiDungSchema)

// === MÔ HÌNH ƯỚC MƠ ===
const uocMoSchema = new mongoose.Schema({
  noiDung: { type: String, required: true },
  mucTien: { type: Number, default: 0 },
  hoanThanh: { type: Boolean, default: false },
  nguoiDungId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true }
})
const UocMo = mongoose.model('UocMo', uocMoSchema)

// === ĐĂNG KÝ ===
app.post('/api/dang-ky', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    
    const daCo = await NguoiDung.findOne({ tenDangNhap })
    if (daCo) {
      return res.json({ loi: 'Tên đăng nhập đã có người dùng! 😅' })
    }

    const nguoiDungMoi = new NguoiDung({ tenDangNhap, matKhau })
    await nguoiDungMoi.save()
    
    res.json({ thanhCong: true, thongBao: 'Đăng ký thành công! 🎉 Đăng nhập thôi!' })
  } catch (err) {
    res.json({ loi: 'Lỗi: ' + err.message })
  }
})

// === ĐĂNG NHẬP ===
app.post('/api/dang-nhap', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    const nguoiDung = await NguoiDung.findOne({ tenDangNhap, matKhau })
    
    if (!nguoiDung) {
      return res.json({ loi: 'Sai tên đăng nhập hoặc mật khẩu! 🤔' })
    }

    res.json({ 
      thanhCong: true, 
      nguoiDungId: nguoiDung._id,
      tenDangNhap: nguoiDung.tenDangNhap,
      thongBao: 'Chào mừng trở lại, ' + nguoiDung.tenDangNhap + '! 🌟'
    })
  } catch (err) {
    res.json({ loi: 'Lỗi: ' + err.message })
  }
})

// === LẤY DANH SÁCH ƯỚC MƠ ===
app.get('/api/uoc-mo', async (req, res) => {
  try {
    const { nguoiDungId } = req.query
    if (!nguoiDungId) return res.json([])
    
    const danhSach = await UocMo.find({ nguoiDungId }).sort({ _id: -1 })
    res.json(danhSach)
  } catch (err) {
    res.json({ loi: 'Lỗi lấy dữ liệu: ' + err.message })
  }
})

// === THÊM ƯỚC MƠ ===
app.post('/api/uoc-mo', async (req, res) => {
  try {
    const { noiDung, mucTien, nguoiDungId } = req.body
    if (!nguoiDungId) {
      return res.json({ loi: 'Bạn cần đăng nhập trước! 🔐' })
    }
    
    const uocMoMoi = new UocMo({ noiDung, mucTien, nguoiDungId })
    await uocMoMoi.save()
    res.json(uocMoMoi)
  } catch (err) {
    res.json({ loi: 'Lỗi lưu: ' + err.message })
  }
})

// === CHẠY SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`)
  console.log(`✅ Sẵn sàng nhận yêu cầu từ React!`)
})