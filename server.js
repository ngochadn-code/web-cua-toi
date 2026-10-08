const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = process.env.PORT || 8888

// === KHÓA BÍ MẬT — tạo ngẫu nhiên, giữ kín! ===
const KHOA_JWT = process.env.JWT_SECRET || 'khoa_bi_mat_so_01_2026_uy_tin'

// === CẤU HÌNH ===
app.use(cors())
app.use(express.json())

// === KẾT NỐI MONGODB ===
mongoose.connect('mongodb+srv://ngochadn68_db_user:PszceWhFPbYDcGj1@cluster0.eaex6lz.mongodb.net/?appName=Cluster0?retryWrites=true&w=majority')
  .then(() => console.log('✅ Kết nối MongoDB THÀNH CÔNG!'))
  .catch(err => console.log('❌ Lỗi kết nối:', err.message))

// === MÔ HÌNH ===
const nguoiDungSchema = new mongoose.Schema({
  tenDangNhap: { type: String, required: true, unique: true },
  matKhau: { type: String, required: true },
  ngayTao: { type: Date, default: Date.now }
})
const NguoiDung = mongoose.model('NguoiDung', nguoiDungSchema)

const uocMoSchema = new mongoose.Schema({
  noiDung: { type: String, required: true },
  mucTien: { type: Number, default: 0 },
  hoanThanh: { type: Boolean, default: false },
  nguoiDungId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },
  ngayTao: { type: Date, default: Date.now },
  ngayHoanThanh: { type: Date, default: null }
})
const UocMo = mongoose.model('UocMo', uocMoSchema)

// === BỘ LỌC BẢO VỆ ROUTE ===
const yeuCauDangNhap = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ loi: 'Thiếu thông tin đăng nhập 🔐' })
    
    const giaiMa = jwt.verify(token, KHOA_JWT)
    req.nguoiDungId = giaiMa.nguoiDungId
    next()
  } catch (err) {
    return res.status(401).json({ loi: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại 🔄' })
  }
}

// === ĐĂNG KÝ ===
app.post('/api/dang-ky', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    if (!tenDangNhap.trim() || matKhau.length < 6) {
      return res.json({ loi: 'Tên ≥ 3 ký tự, mật khẩu ≥ 6 ký tự nhé! ✍️' })
    }
    
    const daCo = await NguoiDung.findOne({ tenDangNhap })
    if (daCo) return res.json({ loi: 'Tên đã có người dùng! 😅' })

    const matKhauMaHoa = await bcrypt.hash(matKhau, 10)
    const nguoiDungMoi = new NguoiDung({ tenDangNhap, matKhau: matKhauMaHoa })
    await nguoiDungMoi.save()
    
    res.json({ thanhCong: true, thongBao: 'Đăng ký thành công! 🎉 Đăng nhập thôi!' })
  } catch (err) {
    res.json({ loi: 'Lỗi: ' + err.message })
  }
})

// === ĐĂNG NHẬP — TRẢ VỀ TOKEN ===
app.post('/api/dang-nhap', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    const nguoiDung = await NguoiDung.findOne({ tenDangNhap })
    if (!nguoiDung) return res.json({ loi: 'Sai tên hoặc mật khẩu! 🤔' })

    const khop = await bcrypt.compare(matKhau, nguoiDung.matKhau)
    if (!khop) return res.json({ loi: 'Sai tên hoặc mật khẩu! 🤔' })

    // Tạo token hợp lệ 7 ngày
    const token = jwt.sign({ nguoiDungId: nguoiDung._id }, KHOA_JWT, { expiresIn: '7d' })
    
    res.json({
      thanhCong: true,
      token,
      tenDangNhap: nguoiDung.tenDangNhap,
      nguoiDungId: nguoiDung._id,
      thongBao: 'Chào mừng trở lại, ' + nguoiDung.tenDangNhap + '! 🌟'
    })
  } catch (err) {
    res.json({ loi: 'Lỗi: ' + err.message })
  }
})

// === CÁC ROUTE ĐƯỢC BẢO VỆ ===
app.get('/api/uoc-mo', yeuCauDangNhap, async (req, res) => {
  try {
    const danhSach = await UocMo.find({ nguoiDungId: req.nguoiDungId }).sort({ _id: -1 })
    res.json(danhSach)
  } catch (err) {
    res.json({ loi: 'Lỗi lấy dữ liệu: ' + err.message })
  }
})

app.post('/api/uoc-mo', yeuCauDangNhap, async (req, res) => {
  try {
    const { noiDung, mucTien } = req.body
    const uocMoMoi = new UocMo({ noiDung, mucTien, nguoiDungId: req.nguoiDungId })
    await uocMoMoi.save()
    res.json(uocMoMoi)
  } catch (err) {
    res.json({ loi: 'Lỗi lưu: ' + err.message })
  }
})

app.patch('/api/uoc-mo/:id/hoan-thanh', yeuCauDangNhap, async (req, res) => {
  try {
    const uocMo = await UocMo.findOne({ _id: req.params.id, nguoiDungId: req.nguoiDungId })
    if (!uocMo) return res.json({ loi: 'Không tìm thấy! 🛡️' })
    
    uocMo.hoanThanh = !uocMo.hoanThanh
    uocMo.ngayHoanThanh = uocMo.hoanThanh ? new Date() : null
    await uocMo.save()
    res.json(uocMo)
  } catch (err) {
    res.json({ loi: 'Lỗi cập nhật: ' + err.message })
  }
})

app.delete('/api/uoc-mo/:id', yeuCauDangNhap, async (req, res) => {
  try {
    const ketQua = await UocMo.deleteOne({ _id: req.params.id, nguoiDungId: req.nguoiDungId })
    if (ketQua.deletedCount === 0) return res.json({ loi: 'Không tìm thấy! 🛡️' })
    res.json({ thanhCong: true, thongBao: 'Đã xóa! 🗑️' })
  } catch (err) {
    res.json({ loi: 'Lỗi xóa: ' + err.message })
  }
})

// === TRANG CHỦ ===
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);margin:0">
        <div style="background:white;padding:3rem;border-radius:20px;text-align:center;box-shadow:0 15px 40px rgba(0,0,0,0.2)">
          <h1 style="color:#4a5568;margin:0">✨ Sổ Ước Mơ — Server ✨</h1>
          <p style="color:#718096;font-size:1.2rem">✅ Token JWT đã kích hoạt bảo mật 🔒</p>
          <p style="color:#718096">Sử dụng ứng dụng tại trang Frontend nhé 💚</p>
        </div>
      </body>
    </html>
  `)
})

// === CHẠY ===
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`)
  console.log(`✅ Bảo mật JWT + mã hóa mật khẩu đã sẵn sàng! 🔒`)
})