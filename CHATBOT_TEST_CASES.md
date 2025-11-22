# Chatbot Test Cases

## 1. Thêm giao dịch (Add Expense)

### Test Case 1.1: Thêm giao dịch đơn giản
- **Input**: "ăn bún bò 50k"
- **Expected**: Hiển thị panel với giao dịch "ăn bún bò" -50.000₫, category "Ăn uống"

### Test Case 1.2: Thêm với mô tả dài
- **Input**: "uống trà sữa gongcha 60 nghìn"
- **Expected**: Panel hiển thị "uống trà sữa gongcha" -60.000₫

### Test Case 1.3: Thêm nhiều giao dịch
- **Input**: "ăn jolibee 70k, uống coca 20k"
- **Expected**: Panel hiển thị 2 giao dịch

### Test Case 1.4: Thêm với ngày cụ thể
- **Input**: "ăn phở 40k ngày 5/11"
- **Expected**: Panel hiển thị giao dịch với paid_at = 5/11/2025

---

## 2. Tìm kiếm giao dịch (Search Expense)

### Test Case 2.1: Tìm theo mô tả
- **Input**: "tìm giao dịch đổ xăng"
- **Expected**: Panel hiển thị các giao dịch có chứa "xăng" trong description

### Test Case 2.2: Tìm theo ngày
- **Input**: "tìm giao dịch ngày 6/11"
- **Expected**: Panel hiển thị tất cả giao dịch ngày 6/11

### Test Case 2.3: Tìm theo mô tả + ngày
- **Input**: "tìm giao dịch đổ xăng ngày 6/11"
- **Expected**: Panel hiển thị giao dịch "xăng e5 petro" ngày 6/11

### Test Case 2.4: Tìm không có kết quả
- **Input**: "tìm giao dịch mua xe ngày 1/1"
- **Expected**: Message "Không tìm thấy giao dịch nào."

### Test Case 2.5: Tìm với ngày không có số 0 đứng trước
- **Input**: "tìm giao dịch ngày 6/11"
- **Expected**: Tìm được giao dịch (test fallback parse date)

---

## 3. Cập nhật giao dịch (Update Expense)

### Test Case 3.1: Sửa giá tiền
- **Input**: "sửa giao dịch uống trà táo hôm nay thành 50k"
- **Expected**: Panel hiển thị giao dịch đã được cập nhật với giá mới

### Test Case 3.2: Sửa mô tả
- **Input**: "sửa giao dịch uống trà táo hôm nay thành cà phê"
- **Expected**: Panel hiển thị giao dịch với description mới "cà phê"

### Test Case 3.3: Sửa cả giá và mô tả
- **Input**: "sửa giao dịch đổ xăng ngày 6/11 thành 60k và mô tả là xăng A95"
- **Expected**: Panel hiển thị giao dịch đã cập nhật

---

## 4. Xóa giao dịch (Delete Expense)

### Test Case 4.1: Xóa theo mô tả
- **Input**: "xóa giao dịch ăn bún bò"
- **Expected**: Message "Đã xóa 1 giao dịch."

### Test Case 4.2: Xóa theo ngày
- **Input**: "xóa tất cả giao dịch ngày 1/1"
- **Expected**: Message "Đã xóa X giao dịch." (X = số lượng)

---

## 5. Thống kê (Statistics)

### Test Case 5.1: Thống kê hôm nay
- **Input**: "hôm nay tôi đã chi bao nhiêu tiền"
- **Expected**: Message "Tổng chi tiêu: X₫ (Y giao dịch)." với chi tiết theo category

### Test Case 5.2: Thống kê hôm qua
- **Input**: "hôm qua tôi đã chi bao nhiêu tiền"
- **Expected**: Tổng chi tiêu của ngày hôm qua

### Test Case 5.3: Thống kê tháng này
- **Input**: "tháng này tôi đã chi bao nhiêu tiền"
- **Expected**: Tổng chi tiêu của tháng hiện tại

### Test Case 5.4: Thống kê tháng cụ thể
- **Input**: "tháng 11 tôi đã chi bao nhiêu tiền"
- **Expected**: Tổng chi tiêu tháng 11/2025

### Test Case 5.5: Thống kê khoảng thời gian
- **Input**: "10 ngày qua tôi đã chi bao nhiêu tiền"
- **Expected**: Tổng chi tiêu 10 ngày gần nhất

### Test Case 5.6: Thống kê không có dữ liệu
- **Input**: "tháng 1 tôi đã chi bao nhiêu tiền" (giả sử không có dữ liệu)
- **Expected**: "Không có giao dịch nào trong khoảng thời gian này."

---

## 6. Edge Cases & Error Handling

### Test Case 6.1: Câu hỏi không rõ ràng
- **Input**: "tìm kiếm"
- **Expected**: Message yêu cầu thêm thông tin (mô tả, giá tiền, ngày tháng, hoặc địa điểm)

### Test Case 6.2: Ngày không hợp lệ
- **Input**: "tìm giao dịch ngày 32/13"
- **Expected**: Xử lý lỗi hoặc message phù hợp

### Test Case 6.3: Câu hỏi không liên quan
- **Input**: "thời tiết hôm nay thế nào"
- **Expected**: Message fallback hoặc yêu cầu làm rõ

### Test Case 6.4: Nhiều intent trong một câu
- **Input**: "tìm giao dịch xăng và thêm ăn phở 40k"
- **Expected**: Xử lý cả 2 intent hoặc ưu tiên một intent

---

## 7. UI/UX Tests

### Test Case 7.1: Hiển thị panel sau khi thêm
- **Action**: Thêm giao dịch
- **Expected**: Panel hiển thị với đầy đủ thông tin, có thể edit category

### Test Case 7.2: Hiển thị panel sau khi update
- **Action**: Update giao dịch
- **Expected**: Panel hiển thị giao dịch đã được cập nhật

### Test Case 7.3: Edit category trong panel
- **Action**: Click vào category trong panel → chọn category mới
- **Expected**: Category được cập nhật, panel refresh

### Test Case 7.4: Multiple transactions trong panel
- **Action**: Tìm kiếm trả về nhiều kết quả
- **Expected**: Panel hiển thị scrollable list với tất cả giao dịch

---

## 8. Date Parsing Tests (Quan trọng)

### Test Case 8.1: Ngày với format khác nhau
- **Inputs**: 
  - "tìm giao dịch ngày 6/11"
  - "tìm giao dịch ngày 06/11"
  - "tìm giao dịch ngày 6-11"
- **Expected**: Tất cả đều tìm được giao dịch ngày 6/11

### Test Case 8.2: Ngày với năm
- **Input**: "tìm giao dịch ngày 6/11/2025"
- **Expected**: Tìm được giao dịch đúng ngày

### Test Case 8.3: Ngày tương đối
- **Inputs**:
  - "hôm nay tôi đã chi bao nhiêu"
  - "hôm qua tôi đã chi bao nhiêu"
  - "2 ngày trước tôi đã chi bao nhiêu"
- **Expected**: Tính đúng ngày và trả về thống kê

### Test Case 8.4: Tháng tương đối
- **Inputs**:
  - "tháng này tôi đã chi bao nhiêu"
  - "tháng trước tôi đã chi bao nhiêu"
- **Expected**: Tính đúng tháng và trả về thống kê

---

## Checklist khi test:

- [ ] Tất cả test cases trên đều pass
- [ ] Panel hiển thị đúng sau add/update/search
- [ ] Date parsing hoạt động với các format khác nhau
- [ ] Error handling xử lý đúng các edge cases
- [ ] UI responsive và không có lỗi console (trừ extension errors)
- [ ] Fallback search hoạt động khi backend trả về rỗng nhưng có date string
