import pandas as pd
import sys

def analyze_excel(filename):
    try:
        print(f"📊 تحلیل فایل: {filename}")
        print("=" * 60)
        
        # Read Excel file
        excel_file = pd.ExcelFile(filename)
        print(f"📋 تعداد شیت‌ها: {len(excel_file.sheet_names)}")
        
        for i, sheet_name in enumerate(excel_file.sheet_names):
            print(f"   {i+1}. {sheet_name}")
        print()
        
        # Analyze each sheet
        for sheet_name in excel_file.sheet_names:
            print(f"🔍 تحلیل شیت: {sheet_name}")
            print("=" * 50)
            
            df = pd.read_excel(filename, sheet_name=sheet_name)
            
            print(f"📈 تعداد ردیف‌ها: {len(df)}")
            print(f"📊 تعداد ستون‌ها: {len(df.columns)}")
            print()
            
            print("📋 سرستون‌ها:")
            for i, col in enumerate(df.columns):
                print(f"   {i+1}. {col}")
            print()
            
            if not df.empty:
                print("📝 نمونه داده‌ها (5 ردیف اول):")
                print(df.head().to_string())
                print()
                
                print("🔍 تحلیل ستون‌ها:")
                for col in df.columns:
                    non_null_count = df[col].count()
                    null_count = len(df) - non_null_count
                    data_type = str(df[col].dtype)
                    print(f"   {col}:")
                    print(f"      - نوع داده: {data_type}")
                    print(f"      - مقادیر پر: {non_null_count}")
                    print(f"      - مقادیر خالی: {null_count}")
                    
                    # Show sample values
                    sample_values = df[col].dropna().head(3).tolist()
                    print(f"      - نمونه‌ها: {sample_values}")
                    print()
            print()
            
    except Exception as e:
        print(f"خطا در تحلیل فایل: {e}")

if __name__ == "__main__":
    analyze_excel("products_detailed.xlsx")
