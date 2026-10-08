const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = process.env.PORT || 8888

// === KHÓA BÍ MẬT ===
const KHOA_JWT = process.env.JWT_SECRET || 'khoa_bi_mat_so_01_2026_uy_tin'

// === CẤU HÌNH ===
app.use(cors())
app.use(express.json())

// === KẾT NỐI MONGODB ===
mongoose.connect('mongodb+srv://ngochadn68_db_user:PszceWhFPbYDcGj1@cluster0.eaex6lz.mongodb.net/?appName=Cluster0')
  .then(() => console.log('✅ Kết nối MongoDB THÀNH CÔNG!'))
  .catch(err => console.log('❌ Lỗi kết nối:', err.message))

// === MÔ HÌNH DỮ LIỆU ===
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

// === BỘ LỌC BẢO VỆ ===
const yeuCauDangNhap = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ loi: 'Thiếu thông tin đăng nhập 🔐' })
    
    const giaiMa = jwt.verify(token, KHOA_JWT)
    req.nguoiDungId = giaiMa.nguoiDungId
    next()
  } catch (err) {
    return res.status(401).json({ loi: 'Phiên hết hạn, vui lòng đăng nhập lại 🔄' })
  }
}

// === ĐĂNG KÝ ===
app.post('/api/dang-ky', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    if (!tenDangNhap?.trim() || matKhau.length < 6) {
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

// === ĐĂNG NHẬP ===
app.post('/api/dang-nhap', async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body
    const nguoiDung = await NguoiDung.findOne({ tenDangNhap })
    if (!nguoiDung) return res.json({ loi: 'Sai tên hoặc mật khẩu! 🤔' })

    const khop = await bcrypt.compare(matKhau, nguoiDung.matKhau)
    if (!khop) return res.json({ loi: 'Sai tên hoặc mật khẩu! 🤔' })

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

// === LẤY DANH SÁCH ===
app.get('/api/uoc-mo', yeuCauDangNhap, async (req, res) => {
  try {
    const danhSach = await UocMo.find({ nguoiDungId: req.nguoiDungId }).sort({ _id: -1 })
    res.json(danhSach)
  } catch (err) {
    res.json({ loi: 'Lỗi lấy dữ liệu: ' + err.message })
  }
})

// === THÊM ƯỚC MƠ ===
app.post('/api/uoc-mo', yeuCauDangNhap, async (req, res) => {
  try {
    const { noiDung, mucTien } = req.body
    const uocMoMoi = new UocMo({ noiDung, mucTien: Number(mucTien) || 0, nguoiDungId: req.nguoiDungId })
    await uocMoMoi.save()
    res.json(uocMoMoi)
  } catch (err) {
    res.json({ loi: 'Lỗi lưu: ' + err.message })
  }
})

// === ĐÁNH DẤU HOÀN THÀNH ===
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

// === XÓA ===
app.delete('/api/uoc-mo/:id', yeuCauDangNhap, async (req, res) => {
  try {
    const ketQua = await UocMo.deleteOne({ _id: req.params.id, nguoiDungId: req.nguoiDungId })
    if (ketQua.deletedCount === 0) return res.json({ loi: 'Không tìm thấy! 🛡️' })
    res.json({ thanhCong: true, thongBao: 'Đã xóa! 🗑️' })
  } catch (err) {
    res.json({ loi: 'Lỗi xóa: ' + err.message })
  }
})

// === API CHIA SẺ CÔNG KHAI ===
app.get('/api/chia-se/:nguoiDungId', async (req, res) => {
  try {
    const { nguoiDungId } = req.params
    const danhSach = await UocMo.find({ 
      nguoiDungId, 
      hoanThanh: false 
    }).sort({ _id: -1 }).limit(10)
    
    const nguoiDung = await NguoiDung.findById(nguoiDungId)
    if (!nguoiDung) return res.json({ loi: 'Không tìm thấy người dùng! 🤔' })

    const tatCa = await UocMo.find({ nguoiDungId })
    const tongTien = tatCa.reduce((t, i) => t + (i.mucTien || 0), 0)
    const daHoanThanh = tatCa.filter(i => i.hoanThanh).length
    const phanTram = tatCa.length > 0 ? Math.round((daHoanThanh / tatCa.length) * 100) : 0

    res.json({
      tenNguoiDung: nguoiDung.tenDangNhap,
      tongSoUocMo: tatCa.length,
      daHoanThanh,
      phanTram,
      tongTien,
      danhSachChuaHoanThanh: danhSach
    })
  } catch (err) {
    res.json({ loi: 'Lỗi: ' + err.message })
  }
})

// === TRANG CHIA SẺ ===
app.get('/chia-se/:nguoiDungId', async (req, res) => {
  try {
    const { nguoiDungId } = req.params
    const nguoiDung = await NguoiDung.findById(nguoiDungId)
    if (!nguoiDung) return res.send('<h1 style="text-align:center;padding:3rem;">Không tìm thấy! 😅</h1>')

    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sổ Ước Mơ của ${nguoiDung.tenDangNhap}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}
    body{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:2rem 1rem}
    .container{max-width:500px;margin:0 auto}
    .card{background:#fff;border-radius:20px;padding:2rem;box-shadow:0 10px 40px rgba(0,0,0,.2);margin-bottom:1.5rem}
    h1{text-align:center;color:#4a5568;margin-bottom:.5rem}
    .thong-ke{display:flex;justify-content:space-around;text-align:center;margin:1.5rem 0;flex-wrap:wrap;gap:1rem}
    .so-lon{font-size:1.8rem;font-weight:bold}
    .xanh{color:#48bb78}.tim{color:#667eea}.vang{color:#f6ad55}
    .thanh-tien-do{height:12px;background:#e2e8f0;border-radius:6px;margin:1rem 0;overflow:hidden}
    .thanh{height:100%;background:linear-gradient(90deg,#48bb78,#38a169);border-radius:6px;transition:width .5s ease}
    .muc{padding:1rem;border-bottom:1px solid #e2e8f0}
    .muc:last-child{border-bottom:none}
    .noi-dung{font-weight:500;color:#2d3748;margin-bottom:.3rem}
    .tien{color:#667eea;font-weight:bold}
    .chan-trang{text-align:center;margin-top:2rem;color:#fff;opacity:.8;font-size:.9rem}
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>✨ Sổ Ước Mơ ✨</h1>
      <p style="text-align:center;color:#718096;margin-bottom:1rem">${nguoiDung.tenDangNhap}</p>
      <div class="thong-ke">
        <div><p class="so-lon tim" id="tongTien">0</p><p style="color:#718096;font-size:.9rem">Tổng giá trị</p></div>
        <div><p class="so-lon xanh" id="phanTram">0%</p><p style="color:#718096;font-size:.9rem">Đã hoàn thành</p></div>
        <div><p class="so-lon vang" id="tongSo">0</p><p style="color:#718096;font-size:.9rem">Tổng số</p></div>
      </div>
      <div class="thanh-tien-do"><div class="thanh" id="thanh" style="width:0%"></div></div>
    </div>
    <div class="card" id="danhSach">
      <h3 style="color:#4a5568;margin-bottom:1rem">Đang hướng tới 🌟</h3>
      <p style="color:#718096;text-align:center">Đang tải...</p>
    </div>
    <p class="chan-trang">💫 Sổ Ước Mơ — Chia sẻ ước mơ của bạn</p>
  </div>
  <script>
    fetch('/api/chia-se/${nguoiDungId}')
      .then(r=>r.json())
      .then(d=>{
        if(d.loi) return document.body.innerHTML='<div style="text-align:center;color:#fff;padding:3rem;"><h1>'+d.loi+'</h1></div>'
        document.getElementById('tongTien').textContent=new Intl.NumberFormat('vi-VN').format(d.tongTien)+' ₫'
        document.getElementById('phanTram').textContent=d.phanTram+'%'
        document.getElementById('tongSo').textContent=d.tongSoUocMo
        document.getElementById('thanh').style.width=d.phanTram+'%'
        const ds=document.getElementById('danhSach')
        if(d.danhSachChuaHoanThanh.length===0){
          ds.innerHTML='<h3 style="color:#4a5568;margin-bottom:1rem">Tất cả hoàn thành! 🎉</h3><p style="text-align:center;color:#48bb78;font-size:1.2rem">Không còn gì! 🌟</p>'
        }else{
          let h='<h3 style="color:#4a5568;margin-bottom:1rem">Đang hướng tới 💫</h3>'
          d.danhSachChuaHoanThanh.forEach(i=>{
            h+='<div class="muc"><p class="noi-dung">'+i.noiDung+'</p>'
            if(i.mucTien>0)h+='<p class="tien">'+new Intl.NumberFormat('vi-VN').format(i.mucTien)+' ₫</p>'
            h+='</div>'
          })
          ds.innerHTML=h
        }
      })
  </script>
</body>
</html>
    `)
  } catch (err) {
    res.send('<h1>Lỗi: ' + err.message + '</h1>')
  }
})

// === TRANG CHỦ SERVER ===
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);margin:0">
        <div style="background:white;padding:3rem;border-radius:20px;text-align:center;box-shadow:0 15px 40px rgba(0,0,0,.2)">
          <h1 style="color:#4a5568;margin:0">✨ Sổ Ước Mơ — Server ✨</h1>
          <p style="color:#718096;font-size:1.2rem">✅ Server đang chạy ổn!</p>
          <p style="color:#718096">JWT bảo mật + chia sẻ đã sẵn sàng 🔒</p>
        </div>
      </body>
    </html>
  `)
})

// === KHỞI ĐỘNG SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`)
  console.log(`✅ Sẵn sàng — Bảo mật & Chia sẻ 🔒`)
})