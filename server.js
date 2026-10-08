const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs') // Thư viện mã hóa 🔒

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
  matKhau: { type: String, required: true }, // Sẽ lưu dạng mã hóa
  ngayTao: { type: Date, default: Date.now }
})
const NguoiDung = mongoose.model('NguoiDung', nguoiDungSchema)

// === MÔ HÌNH ƯỚC MƠ — CẬP NHẬT THÊM NGÀY ===
const uocMoSchema = new mongoose.Schema({
  noiDung: { type: String, required: true },
  mucTien: { type: Number, default: 0 },
  hoanThanh: { type: Boolean, default: false },
  nguoiDungId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },
  ngayTao: { type: Date, default: Date.now },        // Ngày tạo 🌟
  ngayHoanThanh: { type: Date, default: null }       // Ngày đánh dấu xong ✅
})
const UocMo = mongoose.model('UocMo', uocMoSchema)

// === ĐĂNG KÝ — MÃ HÓA MẬT KHẨU TRƯỚC KHI LƯU 🔐 ===
app.post('/api/dang-ky', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    
    // Kiểm tra tên đã tồn tại
    const daCo = await NguoiDung.findOne({ tenDangNhap })
    if (daCo) {
      return res.json({ loi: 'Tên đăng nhập đã có người dùng! 😅' })
    }

    // Mã hóa mật khẩu — 10 vòng bảo mật
    const matKhauMaHoa = await bcrypt.hash(matKhau, 10)

    // Lưu mật khẩu đã mã hóa
    const nguoiDungMoi = new NguoiDung({ 
      tenDangNhap, 
      matKhau: matKhauMaHoa 
    })
    await nguoiDungMoi.save()
    
    res.json({ thanhCong: true, thongBao: 'Đăng ký thành công! 🎉 Đăng nhập thôi!' })
  } catch (err) {
    res.json({ loi: 'Lỗi: ' + err.message })
  }
})

// === ĐĂNG NHẬP — SO SÁNH MẬT KHẨU ĐÚNG SAI 🔐 ===
app.post('/api/dang-nhap', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    
    // Tìm người dùng
    const nguoiDung = await NguoiDung.findOne({ tenDangNhap })
    if (!nguoiDung) {
      return res.json({ loi: 'Sai tên đăng nhập hoặc mật khẩu! 🤔' })
    }

    // So sánh mật khẩu với bản mã hóa
    const khopMatKhau = await bcrypt.compare(matKhau, nguoiDung.matKhau)
    if (!khopMatKhau) {
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

// === LẤY DANH SÁCH ===
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

// === ĐÁNH DẤU HOÀN THÀNH — CẬP NHẬT NGÀY ===
app.patch('/api/uoc-mo/:id/hoan-thanh', async (req, res) => {
  try {
    const { id } = req.params
    const { nguoiDungId } = req.body
    
    const uocMo = await UocMo.findOne({ _id: id, nguoiDungId })
    if (!uocMo) {
      return res.json({ loi: 'Không tìm thấy hoặc không có quyền! 🛡️' })
    }
    
    uocMo.hoanThanh = !uocMo.hoanThanh
    // Đặt ngày hoàn thành nếu đánh dấu xong, ngược lại bỏ
    uocMo.ngayHoanThanh = uocMo.hoanThanh ? new Date() : null
    await uocMo.save()
    res.json(uocMo)
  } catch (err) {
    res.json({ loi: 'Lỗi cập nhật: ' + err.message })
  }
})

// === XÓA ƯỚC MƠ ===
app.delete('/api/uoc-mo/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nguoiDungId } = req.body
    
    const ketQua = await UocMo.deleteOne({ _id: id, nguoiDungId })
    if (ketQua.deletedCount === 0) {
      return res.json({ loi: 'Không tìm thấy hoặc không có quyền! 🛡️' })
    }
    
    res.json({ thanhCong: true, thongBao: 'Đã xóa! 🗑️' })
  } catch (err) {
    res.json({ loi: 'Lỗi xóa: ' + err.message })
  }
})
// === TRANG CHỦ — XÁC NHẬN SERVER ĐANG CHẠY ===
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);margin:0">
        <div style="background:white;padding:3rem;border-radius:20px;text-align:center;box-shadow:0 15px 40px rgba(0,0,0,0.2)">
          <h1 style="color:#4a5568;margin:0">✨ Sổ Ước Mơ — Server ✨</h1>
          <p style="color:#718096;font-size:1.2rem">✅ Server đang chạy ổn!</p>
          <p style="color:#718096">Sử dụng ứng dụng tại trang Frontend nhé 💚</p>
        </div>
      </body>
    </html>
  `)
})
// === CHẠY SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`)
  console.log(`✅ Bảo mật mật khẩu + ghi thời gian đã kích hoạt! 🔒`)
})