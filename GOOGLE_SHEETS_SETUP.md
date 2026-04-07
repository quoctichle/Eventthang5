# Hướng dẫn kết nối Google Sheets

## Bước 1: Tạo Google Apps Script

1. Mở Google Sheet của bạn
2. Vào menu **Tiện ích (Extensions)** → **Apps Script**
3. Xoá toàn bộ code mẫu, dán đoạn code sau vào:

```javascript
const SHEET_NAME = 'CODE CHIẾN DỊCH 1';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'add_codes') {
      // Thêm nhiều mã mới vào sheet (khi Admin tạo mã)
      const lastRow = Math.max(sheet.getLastRow(), 1);
      const codes = data.codes;
      codes.forEach((code, i) => {
        const stt = lastRow + i; // STT tự tăng
        sheet.appendRow([stt, code, 'Chưa quay', '', '', '', '', '']);
      });
    }

    if (data.action === 'update_spin') {
      // Cập nhật trạng thái khi khách quay
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][1] === data.code) {   // Cột B = Mã code
          sheet.getRange(i + 1, 3).setValue('Đã quay');           // C: Trạng thái
          sheet.getRange(i + 1, 4).setValue(data.spin_time);      // D: Thời gian
          sheet.getRange(i + 1, 5).setValue(data.prize_name);     // E: Giải thưởng
          break;
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Nhấn **Lưu (Ctrl+S)**, đặt tên project tùy thích (vd: `EventSync`)

## Bước 2: Deploy Apps Script

1. Nhấn nút **Deploy** (góc phải trên) → **New deployment**
2. Chọn loại: **Web App**
3. Cấu hình:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Nhấn **Deploy** → Copy URL dài (dạng `https://script.google.com/macros/s/XXXX/exec`)

## Bước 3: Cài đặt URL vào Cloudflare Pages

1. Vào **Cloudflare Dashboard** → **Pages** → project của bạn
2. Vào **Settings** → **Environment variables**
3. Thêm biến mới:
   - **Variable name**: `SHEETS_WEBHOOK_URL`
   - **Value**: URL bạn copy ở bước 2
4. Nhấn Save, sau đó **Redeploy** để áp dụng
