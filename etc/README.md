# Excel Data Import Script

This script imports visitor and supplier data from Excel files in this directory into your ASL Market database.

## Prerequisites

1. **Excel Files**: Place your Excel files in this directory:
   - `ASL MARKET VISITOR.xlsx` - for visitor data
   - `َASL SUPPLIER.xlsx` - for supplier data

2. **Dependencies**: The Go modules will be installed automatically when you run the script.

## Excel File Format

### Supplier File Columns (Expected order):
1. **Full Name** (required) - نام کامل
2. **Mobile** (required) - موبایل  
3. **City** (required) - شهر
4. **Address** (required) - آدرس
5. **Wholesale Min Price** (required) - قیمت عمده حداقل
6. **Brand Name** (optional) - نام برند
7. **Business Registration Number** (optional) - شماره ثبت کسب‌وکار
8. **Export Price** (optional) - قیمت صادراتی
9. **Wholesale High Volume Price** (optional) - قیمت عمده حجم بالا
10. **Product Name** (optional) - نام محصول
11. **Product Type** (optional) - نوع محصول
12. **Product Description** (optional) - توضیحات محصول
13. **Monthly Production** (optional) - تولید ماهانه

### Visitor File Columns (Expected order):
1. **Full Name** (required) - نام کامل
2. **National ID** (required) - کد ملی
3. **Birth Date** (required) - تاریخ تولد
4. **Mobile** (required) - موبایل
5. **Residence Address** (required) - آدرس سکونت
6. **City/Province** (required) - شهر/استان
7. **Destination Cities** (required) - شهرهای مقصد
8. **Bank Account IBAN** (required) - شماره حساب بانکی
9. **Bank Name** (required) - نام بانک
10. **Passport Number** (optional) - شماره پاسپورت
11. **WhatsApp Number** (optional) - شماره واتساپ
12. **Email** (optional) - ایمیل
13. **Account Holder Name** (optional) - نام صاحب حساب
14. **Language Level** (optional) - سطح زبان
15. **Marketing Experience** (optional) - تجربه بازاریابی
16. **Special Skills** (optional) - مهارت‌های خاص
17. **Local Contact Details** (optional) - جزئیات آشنای محلی

## How to Run

### Option 1: Using Run Scripts (Recommended)

**Windows:**
```bash
cd C:\Users\Rapexa\Desktop\asl_market
etc\run_import.bat
```

**Linux/Mac:**
```bash
cd /path/to/asl_market
./etc/run_import.sh
```

### Option 2: Manual Run

```bash
# Navigate to the etc directory
cd etc

# Install dependencies and run
go mod tidy
go run excel_importer.go
```

## What the Script Does

1. **Database Connection**: Connects to your existing ASL Market database
2. **User Creation**: Creates user accounts for each person with:
   - Auto-generated email addresses (transliterated from Persian names)
   - Secure random passwords (format: `ASL######!`)
   - Phone numbers from Excel data
3. **Supplier Creation**: Creates supplier profiles with:
   - Personal and business information
   - Product details (if provided)
   - Default "pending" status for admin review
4. **Visitor Creation**: Creates visitor profiles with:
   - Personal identification information
   - Banking details
   - Travel and experience information
   - Default agreements set to true
5. **Duplicate Prevention**: Skips entries if users/suppliers/visitors already exist
6. **Error Handling**: Logs errors and continues processing other records

## Generated Credentials

The script generates:
- **Email**: Transliterated name + mobile digits (e.g., `ahmad.rezaei.1234@aslmarket.local`)
- **Password**: Format `ASL######!` (e.g., `ASL123456!`)

## Output

The script provides detailed logging:
- ✅ Successful imports with record counts
- ⚠️ Warnings for skipped records  
- ❌ Error messages for failed imports
- 👤 User creation notifications with credentials
- 🎉 Final completion status

## Notes

- All imported users start as **active**
- All suppliers/visitors start with **pending** status for admin review
- Existing records are skipped to prevent duplicates
- Missing optional fields are handled gracefully
- Persian text is transliterated for email generation

## After Import

1. Check the Telegram bot admin panel to review imported suppliers and visitors
2. Use the edit/delete functions to manage the imported data
3. Approve or reject suppliers and visitors as needed
4. Users can log in with their generated credentials

## Troubleshooting

1. **File not found**: Ensure Excel files are in this directory with exact names
2. **Database connection**: Check your database credentials in environment variables
3. **Permission errors**: Ensure read access to Excel files
4. **Memory issues**: For large files, the script processes rows one by one

## File Structure

```
/etc/
├── excel_importer.go        # Main import script
├── go.mod                   # Go module dependencies
├── ASL MARKET VISITOR.xlsx  # Your visitor data file
├── َASL SUPPLIER.xlsx        # Your supplier data file
├── run_import.bat           # Windows run script
├── run_import.sh            # Linux/Mac run script
└── README.md                # This file
```
