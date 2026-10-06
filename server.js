// ==========================================
// TUẦN 3 — NGÀY 10: BIỂU ĐỒ & THỐNG KÊ 📊
// ==========================================

const express = require('express');
const fs = require('fs');
const ungDung = express();
const cong = 3000;
const tepDuLieu = 'loinhan.json';

// === MẬT KHẨU ===
const MAT_KHAU_DUNG = '123456';

ungDung.use(express.urlencoded({ extended: true }));

// === Đọc / Ghi dữ liệu ===
function docDuLieu() {
  if (fs.existsSync(tepDuLieu)) return JSON.parse(fs.readFileSync(tepDuLieu, 'utf8'));
  return [];
}
function luuDuLieu(danhSach) {
  fs.writeFileSync(tepDuLieu, JSON.stringify(danhSach, null, 2));
}

// === MENU ===
function menu(duongDan, daDangNhap) {
  const cacMuc = [
    { link: '/', ten: '🏠 Trang chủ' },
    { link: '/duan', ten: '💼 Dự án' },
    { link: '/lienhe', ten: '✉️ Liên hệ' }
  ];
  if (daDangNhap) {
    cacMuc.push({ link: '/danhsach', ten: '📋 Quản lý' });
    cacMuc.push({ link: '/thongke', ten: '📊 Thống kê' });
  }
  let html = '';
  for (let m of cacMuc) {
    const chon = m.link === duongDan ? 'font-weight:bold;background:rgba(255,255,255,0.25)' : '';
    html += `<a href="${m.link}" style="color:white;padding:10px 15px;text-decoration:none;border-radius:8px;${chon}">${m.ten}</a>`;
  }
  if (daDangNhap) html += `<a href="/dangxuat" style="color:#ffcdd2;padding:10px 15px;text-decoration:none;border-radius:8px;float:right;">🚪 Thoát</a>`;
  return html;
}

// === Kiểm tra đăng nhập ===
ungDung.use((yeuCau, TraLoi, tiepTuc) => {
  yeuCau.sessionDaDangNhap = (yeuCau.headers.cookie || '').includes('daDangNhap=true');
  tiepTuc();
});
function yeuCauDangNhap(yeuCau, TraLoi, tiepTuc) {
  if (yeuCau.sessionDaDangNhap) return tiepTuc();
  TraLoi.redirect('/dangnhap?quaylai=' + encodeURIComponent(yeuCau.path));
}

// === TRANG ĐĂNG NHẬP ===
ungDung.get('/dangnhap', (yeuCau, TraLoi) => {
  const quayLai = yeuCau.query.quaylai || '/danhsach';
  TraLoi.send(`
    <!DOCTYPE html>
    <html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Đăng nhập 🔐</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#2c3e50,#3498db);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
      .hop{background:white;border-radius:20px;padding:40px 35px;max-width:420px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.2)}
      .bieuTuong{font-size:60px;text-align:center;margin-bottom:10px}
      h1{text-align:center;color:#2c3e50;margin-bottom:5px;font-size:24px}
      .phu{text-align:center;color:#888;margin-bottom:30px}
      .bao-loi{background:#ffebee;color:#c62828;padding:12px;border-radius:8px;margin-bottom:20px;display:${yeuCau.query.sai?'block':'none'}}
      label{display:block;font-weight:bold;color:#333;margin:20px 0 8px}
      input{width:100%;padding:14px 16px;border:2px solid #ddd;border-radius:10px;font-size:16px}
      input:focus{outline:none;border-color:#3498db}
      button{width:100%;padding:15px;margin-top:25px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:10px;font-size:18px;font-weight:bold;cursor:pointer}
      .quay-lai{text-align:center;margin-top:20px}
      .quay-lai a{color:#3498db;text-decoration:none}
    </style></head>
    <body><div class="hop"><div class="bieuTuong">🔐</div><h1>Chào quản lý</h1><p class="phu">Chỉ người biết mật khẩu mới vào được</p>
    <div class="bao-loi">❌ Mật khẩu sai — thử lại!</div>
    <form action="/xacnhan-dangnhap" method="POST"><input type="hidden" name="quaylai" value="${quayLai}">
    <label>Mật khẩu quản lý</label><input type="password" name="matkhau" placeholder="Nhập mật khẩu..." required autofocus>
    <button>🔓 Mở khóa</button></form>
    <div class="quay-lai"><a href="/">← Về trang chủ</a></div></div></body></html>
  `);
});

// === Xác nhận đăng nhập ===
ungDung.post('/xacnhan-dangnhap', (yeuCau, TraLoi) => {
  if (yeuCau.body.matkhau === MAT_KHAU_DUNG) {
    TraLoi.setHeader('Set-Cookie', 'daDangNhap=true; Path=/; Max-Age=3600');
    TraLoi.redirect(yeuCau.body.quaylai || '/danhsach');
  } else {
    TraLoi.redirect('/dangnhap?sai=1&quaylai=' + encodeURIComponent(yeuCau.body.quaylai));
  }
});

// === Đăng xuất ===
ungDung.get('/dangxuat', (yeuCau, TraLoi) => {
  TraLoi.setHeader('Set-Cookie', 'daDangNhap=; Path=/; Max-Age=0');
  TraLoi.redirect('/');
});

// === TRANG CHỦ ===
ungDung.get('/', (yeuCau, TraLoi) => {
  TraLoi.send(`
    <!DOCTYPE html>
    <html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>VŨ VĂN TÚ</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#e0eafc,#cfdef3);min-height:100vh}
      nav{background:rgba(0,0,0,.1);padding:12px;text-align:center;position:sticky;top:0}
      header{background:linear-gradient(135deg,#2c3e50,#3498db);color:white;text-align:center;padding:50px 20px}
      h1{font-size:36px;margin-bottom:10px}
      .noi-dung{max-width:800px;margin:40px auto;padding:0 20px}
      .phan{background:white;border-radius:16px;padding:30px;margin-bottom:20px;box-shadow:0 6px 20px rgba(0,0,0,.08)}
      h2{color:#2c3e50;margin-bottom:15px}
      .nut{display:inline-block;margin-top:15px;padding:12px 25px;background:#3498db;color:white;text-decoration:none;border-radius:8px;font-weight:bold}
      footer{text-align:center;padding:30px;color:#7f8c8d;margin-top:20px}
    </style></head>
    <body><nav>${menu('/', yeuCau.sessionDaDangNhap)}</nav>
    <header><h1>👋 Xin chào, tôi là VŨ VĂN TÚ</h1><p style="font-size:20px;opacity:.9;margin-top:10px;">Học lập trình tại TP.HCM 💪</p></header>
    <div class="noi-dung">
      <div class="phan"><h2>📌 Về tôi</h2><p>Mỗi ngày một sản phẩm thực tế. Không chạy theo xu hướng — chỉ xây dựng nền vững chắc 💎</p><a href="/duan" class="nut">💼 Xem dự án</a></div>
      <div class="phan"><h2>🎯 Tiến độ</h2>
        <ul style="line-height:2;padding-left:20px;margin-top:10px;">
          <li>✅ Tuần 1 — Nền tảng Node.js</li>
          <li>✅ Tuần 2 — Trang web hoàn chỉnh</li>
          <li>✅ Ngày 8 — Bảo vệ mật khẩu 🔐</li>
          <li>✅ Ngày 9 — Tìm kiếm & Lọc 🔍</li>
          <li>✅ Ngày 10 — Biểu đồ & Thống kê 📊</li>
          <li>⏳ Ngày 11 — Đưa trang lên mạng ☁️</li>
          <li>💰 Mục tiêu: Lương 18 triệu/tháng</li>
        </ul>
      </div>
    </div><footer>✨ Phát triển mỗi ngày 💪 ✨</footer></body></html>
  `);
});

// === TRANG DỰ ÁN ===
ungDung.get('/duan', (yeuCau, TraLoi) => {
  const ds = [
    {b:'🧮',t:'Máy tính',m:'Cộng trừ nhân chia',mau:'#4facfe'},
    {b:'🎲',t:'Số may mắn',m:'Tạo số ngẫu nhiên',mau:'#fa709a'},
    {b:'⏱️',t:'Đồng hồ đếm',m:'Đếm giây & báo giờ',mau:'#11998e'},
    {b:'📋',t:'Việc cần làm',m:'Thêm/Đánh dấu/Xóa',mau:'#8e44ad'},
    {b:'💬',t:'Hệ thống lời nhắn',m:'Gửi & Quản lý',mau:'#f093fb'},
    {b:'🔐',t:'Bảo vệ đăng nhập',m:'Chỉ bạn vào được',mau:'#ff9800'},
    {b:'🔍',t:'Tìm kiếm & Lọc',m:'Tìm ngay khi gõ chữ',mau:'#9c27b0'},
    {b:'📊',t:'Biểu đồ thống kê',m:'Số liệu thành hình ảnh',mau:'#27ae60'}
  ];
  let html = '';
  for(let d of ds) html += `<div style="background:white;border-radius:12px;padding:25px;box-shadow:0 4px 15px rgba(0,0,0,.08);border-top:4px solid ${d.mau}"><div style="font-size:36px;margin-bottom:10px;">${d.b}</div><h3 style="color:#2c3e50;margin-bottom:8px;">${d.t}</h3><p style="color:#666;">${d.m}</p></div>`;
  TraLoi.send(`
    <!DOCTYPE html>
    <html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Dự án</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#e0eafc,#cfdef3);min-height:100vh}
      nav{background:rgba(0,0,0,.1);padding:12px;text-align:center;position:sticky;top:0}
      header{background:linear-gradient(135deg,#2c3e50,#3498db);color:white;text-align:center;padding:40px 20px}
      h1{font-size:30px}
      .noi-dung{max-width:1000px;margin:30px auto;padding:0 20px}
      .luoi{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
      footer{text-align:center;padding:30px;color:#7f8c8d;margin-top:20px}
    </style></head>
    <body><nav>${menu('/duan', yeuCau.sessionDaDangNhap)}</nav>
    <header><h1>💼 Dự án của tôi</h1><p style="margin-top:8px;">Từ chưa biết gì → hệ thống phân tích dữ liệu</p></header>
    <div class="noi-dung"><div class="luoi">${html}</div></div>
    <footer>✅ ${ds.length} dự án — mỗi ngày một cấp độ mới</footer></body></html>
  `);
});

// === TRANG LIÊN HỆ ===
ungDung.get('/lienhe', (yeuCau, TraLoi) => {
  TraLoi.send(`
    <!DOCTYPE html>
    <html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Liên hệ</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#e0eafc,#cfdef3);min-height:100vh}
      nav{background:rgba(0,0,0,.1);padding:12px;text-align:center;position:sticky;top:0}
      header{background:linear-gradient(135deg,#2c3e50,#3498db);color:white;text-align:center;padding:40px 20px}
      h1{font-size:30px}
      .noi-dung{max-width:600px;margin:30px auto;padding:0 20px}
      .khoi{background:white;border-radius:16px;padding:35px;box-shadow:0 6px 20px rgba(0,0,0,.1)}
      h2{color:#2c3e50;margin-bottom:25px;text-align:center}
      label{display:block;font-weight:bold;color:#333;margin:20px 0 8px}
      input,textarea{width:100%;padding:12px 15px;border:2px solid #ddd;border-radius:8px;font-size:16px}
      input:focus,textarea:focus{outline:none;border-color:#3498db}
      button{width:100%;padding:14px;margin-top:25px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:8px;font-size:18px;font-weight:bold;cursor:pointer}
      footer{text-align:center;padding:30px;color:#7f8c8d;margin-top:20px}
    </style></head>
    <body><nav>${menu('/lienhe', yeuCau.sessionDaDangNhap)}</nav>
    <header><h1>✉️ Liên hệ với tôi</h1><p style="margin-top:8px;">Gửi lời nhắn, tôi sẽ trả lời sớm 💬</p></header>
    <div class="noi-dung"><div class="khoi"><h2>Viết lời nhắn</h2>
    <form action="/gui" method="POST">
      <label>Tên của bạn</label><input type="text" name="ten" required>
      <label>Liên hệ</label><input type="text" name="lienhe" required>
      <label>Nội dung</label><textarea name="noiDung" rows="5" required></textarea>
      <button>📤 Gửi lời nhắn</button>
    </form></div></div>
    <footer>✨ Cảm ơn bạn 💚</footer></body></html>
  `);
});

// === Xử lý gửi lời nhắn ===
ungDung.post('/gui', (yeuCau, TraLoi) => {
  let ds = docDuLieu();
  ds.unshift({
    id: Date.now(),
    ten: yeuCau.body.ten,
    lienHe: yeuCau.body.lienhe,
    noiDung: yeuCau.body.noiDung,
    thoiGian: new Date().toLocaleString('vi-VN'),
    daDoc: false
  });
  luuDuLieu(ds);
  TraLoi.send(`<html><body style="text-align:center;padding-top:80px;background:#e8f5e9;font-family:sans-serif;"><h1 style="color:#2e7d32">✅ Gửi thành công!</h1><p>Cảm ơn bạn 💚</p><a href="/" style="display:inline-block;margin:20px;padding:12px 25px;background:#3498db;color:white;text-decoration:none;border-radius:8px">← Về trang chủ</a></body></html>`);
});

// === TRANG QUẢN LÝ ===
ungDung.get('/danhsach', (yeuCau, TraLoi) => {
  yeuCauDangNhap(yeuCau, TraLoi, () => {
    let ds = docDuLieu();
    const tuKhoa = (yeuCau.query.tim || '').toLowerCase().trim();
    const boLoc = yeuCau.query.loc || 'tatca';

    if (boLoc === 'chuadoc') ds = ds.filter(i => !i.daDoc);
    if (boLoc === 'dadoc') ds = ds.filter(i => i.daDoc);
    if (tuKhoa) ds = ds.filter(i =>
      i.ten.toLowerCase().includes(tuKhoa) ||
      i.lienHe.toLowerCase().includes(tuKhoa) ||
      i.noiDung.toLowerCase().includes(tuKhoa)
    );

    const dsGoc = docDuLieu();
    const tong = dsGoc.length, chuaDoc = dsGoc.filter(i => !i.daDoc).length, daDoc = dsGoc.filter(i => i.daDoc).length;

    let htmlDs = '';
    if (ds.length === 0) {
      htmlDs = `<p style="text-align:center;color:#888;padding:40px;">${tuKhoa || boLoc !== 'tatca' ? '🔍 Không tìm thấy kết quả' : 'Chưa có lời nhắn nào ✨'}</p>`;
    } else {
      for (let ln of ds) {
        htmlDs += `
          <div style="border-bottom:1px solid #eee;padding:20px 0;${ln.daDoc?'opacity:0.7;':''}">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <div><strong style="color:#2c3e50;font-size:17px;">${ln.daDoc?'✅':'🔴'} ${ln.ten}</strong> <small style="color:#999;">🕐 ${ln.thoiGian}</small></div>
              <div style="display:flex;gap:8px;">
                ${!ln.daDoc?`<form action="/doc/${ln.id}" method="POST" style="display:inline;"><button style="padding:5px 12px;background:#2ecc71;color:white;border:none;border-radius:6px;cursor:pointer;">Đã đọc</button></form>`:`<span style="color:#2ecc71;">Đã đọc</span>`}
                <form action="/xoa/${ln.id}" method="POST" style="display:inline;" onsubmit="return confirm('Chắc xóa?');">
                  <button style="padding:5px 12px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;">Xóa</button>
                </form>
              </div>
            </div>
            <p style="color:#555;margin:8px 0;">📞 Liên hệ: ${ln.lienHe}</p>
            <p style="color:#333;line-height:1.6;${ln.daDoc?'background:#f9f9f9;padding:8px;border-radius:6px;':''}">💬 ${ln.noiDung}</p>
          </div>
        `;
      }
    }

    TraLoi.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Quản lý 🔍</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#f5f7fa,#c3cfe2);min-height:100vh}
          nav{background:rgba(0,0,0,.1);padding:12px;text-align:center;position:sticky;top:0}
          header{background:linear-gradient(135deg,#2c3e50,#3498db);color:white;text-align:center;padding:25px 20px}
          .thong-ke{display:flex;justify-content:center;gap:25px;margin-top:15px;flex-wrap:wrap}
          .so{text-align:center}
          .so-lon{font-size:24px;font-weight:bold}
          .tim-khoi{max-width:700px;margin:20px auto;padding:0 20px}
          .hop-tim{background:white;border-radius:12px;padding:20px;box-shadow:0 4px 15px rgba(0,0,0,.1)}
          .o-tim{width:100%;padding:12px 15px;border:2px solid #ddd;border-radius:8px;font-size:16px;margin-bottom:12px}
          .o-tim:focus{outline:none;border-color:#3498db}
          .nut-loc{padding:8px 16px;border:none;border-radius:20px;cursor:pointer;margin:0 4px;font-weight:bold}
          .nut-loc.tatca{background:#e0e0e0;color:#333}
          .nut-loc.chua{background:#ef5350;color:white}
          .nut-loc.da{background:#2ecc71;color:white}
          .nut-loc.hd{box-shadow:inset 0 0 0 2px #333}
          .noi-dung{max-width:700px;margin:0 auto 30px;padding:0 20px}
          .danh-sach{background:white;border-radius:16px;padding:25px;box-shadow:0 6px 20px rgba(0,0,0,.1)}
          footer{text-align:center;padding:30px;color:#7f8c8d}
        </style>
      </head>
      <body>
        <nav>${menu('/danhsach', true)}</nav>
        <header>
          <h1>📋 Quản lý lời nhắn</h1>
          <div class="thong-ke">
            <div class="so"><div class="so-lon">🔴 ${chuaDoc}</div><div>Chưa đọc</div></div>
            <div class="so"><div class="so-lon">✅ ${daDoc}</div><div>Đã đọc</div></div>
            <div class="so"><div class="so-lon">📊 ${tong}</div><div>Tổng</div></div>
          </div>
        </header>
        <div class="tim-khoi">
          <div class="hop-tim">
            <form method="GET" action="/danhsach">
              <input type="text" name="tim" class="o-tim" placeholder="🔍 Tìm theo tên, nội dung, liên hệ..." value="${tuKhoa}">
              <div style="text-align:center">
                <button type="submit" class="nut-loc tatca">Tìm</button>
                <button type="submit" name="loc" value="tatca" class="nut-loc tatca ${boLoc==='tatca'?'hd':''}">Tất cả</button>
                <button type="submit" name="loc" value="chuadoc" class="nut-loc chua ${boLoc==='chuadoc'?'hd':''}">Chưa đọc</button>
                <button type="submit" name="loc" value="dadoc" class="nut-loc da ${boLoc==='dadoc'?'hd':''}">Đã đọc</button>
                ${tuKhoa?`<a href="/danhsach" style="margin-left:8px;color:#e74c3c;text-decoration:none">✕ Xóa tìm</a>`:''}
              </div>
            </form>
          </div>
        </div>
        <div class="noi-dung"><div class="danh-sach">${htmlDs}</div></div>
        <footer>🔍 Tìm kiếm thông minh — Ngày 9 ✨</footer>
      </body>
      </html>
    `);
  });
});

// === TRANG THỐNG KÊ & BIỂU ĐỒ ===
ungDung.get('/thongke', (yeuCau, TraLoi) => {
  yeuCauDangNhap(yeuCau, TraLoi, () => {
    const ds = docDuLieu();
    const tong = ds.length;
    const chuaDoc = ds.filter(i => !i.daDoc).length;
    const daDoc = ds.filter(i => i.daDoc).length;
    const phanTramChua = tong > 0 ? Math.round((chuaDoc/tong)*100) : 0;
    const phanTramDa = tong > 0 ? Math.round((daDoc/tong)*100) : 0;

    // === Thống kê theo giờ ===
    const gioDem = Array(24).fill(0);
    for (let ln of ds) {
      const phanGio = ln.thoiGian.match(/(\d{1,2}):/);
      if (phanGio) {
        const g = parseInt(phanGio[1]);
        if (!isNaN(g) && g >= 0 && g < 24) gioDem[g]++;
      }
    }
    const gioCaoNhat = gioDem.indexOf(Math.max(...gioDem));

    // === Từ khóa phổ biến ===
    const tuCung = {};
    const tuBo = ['và','của','tôi','bạn','để','được','có','là','với','nên','đã','sẽ','nhé','nếu','rồi','em','chị','anh','chào','gửi','cho','từ','khi','đến','đi','này','đó','thì','như','cũng','rất','một','nhiều','ít','hay','hoặc','không','nên','cần','muốn','tìm','học','lập trình','web','app','sao','tại','gì','thế','nào','cách','bên','ngoài','trong','trước','sau','giờ','ngày','đêm','sáng','trưa','chiều','tối','luôn','thường','thỉnh','thoảng','lúc','khi'];
    for (let ln of ds) {
      const tach = ln.noiDung.toLowerCase().split(/\s+/);
      for (let t of tach) {
        const sach = t.replace(/[.,!?;:]/g,'');
        if (sach.length > 1 && !tuBo.includes(sach)) tuCung[sach] = (tuCung[sach] || 0) + 1;
      }
    }
    const tuSapXep = Object.entries(tuCung).sort((a,b) => b[1]-a[1]).slice(0,6);

    // === Biểu đồ cột theo giờ ===
    let bieuDoGio = '';
    const GioMax = Math.max(...gioDem, 1);
    for (let g=0; g<24; g++) {
      const chieuCao = gioDem[g] > 0 ? Math.max(gioDem[g]*15, 10) : 4;
      const toi = g >= 22 || g < 6;
      bieuDoGio += `
        <div style="text-align:center;width:3.5%">
          <div style="height:${chieuCao}px;background:${toi?'#5c6bc0':'#4facfe'};border-radius:4px 4px 0 0;margin:0 auto;max-width:12px;min-width:4px;"></div>
          <small style="font-size:9px;color:#888;">${g%12||12}${g<12?'a':'p'}</small>
        </div>
      `;
    }

    TraLoi.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Thống kê & Biểu đồ 📊</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#f5f7fa,#c3cfe2);min-height:100vh}
          nav{background:rgba(0,0,0,.1);padding:12px;text-align:center;position:sticky;top:0}
          header{background:linear-gradient(135deg,#2c3e50,#3498db);color:white;text-align:center;padding:30px 20px}
          h1{font-size:28px}
          .noi-dung{max-width:900px;margin:30px auto;padding:0 20px}
          .khoi{background:white;border-radius:16px;padding:25px;margin-bottom:20px;box-shadow:0 6px 20px rgba(0,0,0,.08)}
          h2{color:#2c3e50;margin-bottom:20px;font-size:20px}
          .hang-so{display:flex;gap:20px;flex-wrap:wrap;text-align:center;margin-bottom:10px}
          .cot-so{flex:1;min-width:120px}
          .so-lon{font-size:32px;font-weight:bold}
          .thanh-ngang{height:24px;background:#eee;border-radius:12px;overflow:hidden;margin:15px 0;display:flex}
          .thanh-chua{background:#ef5350;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;transition:width .5s ease}
          .thanh-da{background:#2ecc71;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;transition:width .5s ease}
          .bieu-do-khung{display:flex;align-items:flex-end;height:150px;gap:4px;margin:20px 0;padding-bottom:10px;border-bottom:2px solid #eee}
          .tu-khoa{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
          .tu-muc{padding:8px 16px;border-radius:20px;font-weight:bold}
          footer{text-align:center;padding:30px;color:#7f8c8d}
        </style>
      </head>
      <body>
        <nav>${menu('/thongke', true)}</nav>
        <header><h1>📊 Thống kê & Biểu đồ</h1><p>Dữ liệu lời nhắn — nhìn là hiểu</p></header>
        <div class="noi-dung">
          <!-- TỔNG QUAN -->
          <div class="khoi">
            <h2>📈 Tổng quan</h2>
            <div class="hang-so">
              <div class="cot-so"><div class="so-lon" style="color:#3498db">${tong}</div><div>Tổng lời nhắn</div></div>
              <div class="cot-so"><div class="so-lon" style="color:#ef5350">${chuaDoc}</div><div>Chưa đọc</div></div>
              <div class="cot-so"><div class="so-lon" style="color:#2ecc71">${daDoc}</div><div>Đã đọc</div></div>
            </div>
            <div class="thanh-ngang">
              <div class="thanh-chua" style="width:${phanTramChua}%">${phanTramChua>5?phanTramChua+'%':'&nbsp;'}</div>
              <div class="thanh-da" style="width:${phanTramDa}%">${phanTramDa>5?phanTramDa+'%':'&nbsp;'}</div>
            </div>
            <p style="text-align:center;color:#666;margin-top:5px;">🔴 Chưa đọc ● Đã đọc ✅</p>
          </div>

          <!-- BIỂU ĐỒ THEO GIỜ -->
          <div class="khoi">
            <h2>🕐 Lời nhắn theo giờ trong ngày</h2>
            <p style="color:#666;margin-bottom:10px;">Giờ gửi nhiều nhất: <strong style="color:#3498db">${tong>0?gioCaoNhat+':00 — '+(gioCaoNhat+1)+':00':'Chưa có dữ liệu'}</strong></p>
            <div class="bieu-do-khung">${bieuDoGio}</div>
            <p style="text-align:center;color:#888;font-size:13px;">Xanh dương: Ngày 🌞 | Tím đậm: Đêm 🌙</p>
          </div>

          <!-- TỪ KHÓA NỔI BẬT -->
          <div class="khoi">
            <h2>🏷️ Từ khóa phổ biến</h2>
            <p style="color:#666;margin-bottom:10px;">${tong>0?'Các chủ đề mọi người quan tâm nhất':'Chưa đủ dữ liệu để phân tích'}</p>
            <div class="tu-khoa">
              ${tuSapXep.length>0?tuSapXep.map(([t,s])=>`<span class="tu-muc" style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white">${t} (${s})</span>`).join(''):'<span style="color:#888">Gửi thêm lời nhắn để phân tích 🔍</span>'}
            </div>
          </div>

          <!-- LIÊN KẾT -->
          <div class="khoi" style="text-align:center">
            <a href="/danhsach" style="display:inline-block;padding:12px 25px;background:#3498db;color:white;text-decoration:none;border-radius:8px;font-weight:bold">📋 Xem danh sách lời nhắn</a>
          </div>
        </div>
        <footer>📊 Ngày 10 — Biến số liệu thành hình ảnh ✨</footer>
      </body>
      </html>
    `);
  });
});

// === Cập nhật trạng thái ===
ungDung.post('/doc/:ma', (yeuCau, TraLoi) => {
  if (!yeuCau.sessionDaDangNhap) return TraLoi.redirect('/dangnhap');
  let ds = docDuLieu();
  let ma = parseInt(yeuCau.params.ma);
  let tim = ds.find(i => i.id === ma);
  if (tim) { tim.daDoc = true; luuDuLieu(ds); }
  TraLoi.redirect('/danhsach?' + (yeuCau.headers.referer?.split('?')[1] || ''));
});
ungDung.post('/xoa/:ma', (yeuCau, TraLoi) => {
  if (!yeuCau.sessionDaDangNhap) return TraLoi.redirect('/dangnhap');
  let ds = docDuLieu();
  let ma = parseInt(yeuCau.params.ma);
  ds = ds.filter(i => i.id !== ma);
  luuDuLieu(ds);
  TraLoi.redirect('/danhsach?' + (yeuCau.headers.referer?.split('?')[1] || ''));
});

ungDung.listen(cong, () => {
  console.log('========================================');
  console.log('✅ NGÀY 10 — BIỂU ĐỒ HOÀN THÀNH! 📊');
  console.log('========================================');
  console.log('🏠 Trang chủ:    http://localhost:3000/');
  console.log('📋 Quản lý:      http://localhost:3000/danhsach');
  console.log('📊 Thống kê:     http://localhost:3000/thongke');
  console.log('🔑 Mật khẩu:     ' + MAT_KHAU_DUNG);
  console.log('========================================');
});