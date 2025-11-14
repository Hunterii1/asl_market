# 📸 سیستم آپلود تصویر - مستندات کامل

## 🎯 **خلاصه سیستم**

سیستم آپلود تصویر کامل برای تأمین‌کنندگان و محصولات با قابلیت‌های زیر:
- ✅ آپلود تصویر مستقیم روی سرور
- ✅ پیش‌نمایش لحظه‌ای
- ✅ حذف و تغییر تصویر
- ✅ اعتبارسنجی نوع و حجم فایل
- ✅ نمایش تصویر در کارت‌ها
- ✅ بدون تصویر = کارت عادی

---

## 🏗️ **معماری سیستم**

### **Backend (Go):**

#### 1. **File Upload Handler** (`backend/utils/file_upload.go`)
```go
- UploadImage(): آپلود و ذخیره تصویر
- DeleteImage(): حذف تصویر
- اعتبارسنجی: نوع فایل، حجم (max 5MB)
- فرمت‌های مجاز: JPG, PNG, GIF, WebP
```

#### 2. **Upload Controller** (`backend/controllers/upload_controller.go`)
```go
- UploadSupplierImage(): آپلود تصویر تأمین‌کننده
- UploadProductImage(): آپلود تصویر محصول
- UploadMultipleProductImages(): آپلود چند تصویر (max 5)
- DeleteImage(): حذف تصویر
```

#### 3. **Routes** (`backend/routes/routes.go`)
```go
POST /api/v1/upload/supplier-image
POST /api/v1/upload/product-image
POST /api/v1/upload/product-images
POST /api/v1/upload/delete-image
GET  /uploads/*  (Static file serving)
```

#### 4. **Storage:**
```
backend/uploads/
├── suppliers/
│   └── supplier_uuid.jpg
└── products/
    └── product_uuid.jpg
```

---

### **Frontend (React + TypeScript):**

#### 1. **ImageUpload Component** (`src/components/ImageUpload.tsx`)
```tsx
Props:
- currentImage?: string
- onImageChange: (imageUrl: string) => void
- uploadType: 'supplier' | 'product'
- label?: string
- maxSize?: number (MB)

Features:
- Drag & drop area
- پیش‌نمایش تصویر
- دکمه حذف
- نمایش progress
- خطاهای فارسی
```

#### 2. **API Service** (`src/services/api.ts`)
```typescript
uploadImage(formData: FormData, endpoint: string)
deleteImage(imagePath: string)
```

---

## 📋 **نحوه استفاده**

### **1. در فرم ثبت تأمین‌کننده:**

```tsx
import { ImageUpload } from '@/components/ImageUpload';

<ImageUpload
  currentImage={formData.image_url}
  onImageChange={(imageUrl) => updateFormData('image_url', imageUrl)}
  uploadType="supplier"
  label="تصویر شخصی یا لوگو برند"
/>
```

### **2. در فرم ثبت محصول:**

```tsx
<ImageUpload
  currentImage={productData.image_url}
  onImageChange={(imageUrl) => updateProductData('image_url', imageUrl)}
  uploadType="product"
  label="تصویر محصول"
/>
```

### **3. نمایش تصویر در کارت:**

```tsx
{supplier.image_url && (
  <div className="w-full h-48 bg-muted relative overflow-hidden">
    <img
      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${supplier.image_url}`}
      alt={supplier.brand_name}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement!.style.display = 'none';
      }}
    />
  </div>
)}
```

---

## 🔧 **تنظیمات**

### **Environment Variables:**
```env
VITE_API_URL=http://localhost:8080
```

### **Backend Config:**
```go
MaxImageSize = 5 * 1024 * 1024  // 5MB
AllowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
```

---

## ✅ **وضعیت پیاده‌سازی**

### **تکمیل شده:**
- ✅ Backend upload handler
- ✅ Upload endpoints
- ✅ Static file serving
- ✅ Frontend ImageUpload component
- ✅ API service methods
- ✅ فرم ثبت تأمین‌کننده
- ✅ نمایش تصویر در کارت تأمین‌کننده
- ✅ بدون تصویر = کارت عادی

### **در حال انجام:**
- 🔄 فرم ویرایش تأمین‌کننده
- 🔄 فرم ثبت محصول
- 🔄 فرم ویرایش محصول
- 🔄 نمایش تصویر در کارت محصول

---

## 🎨 **طراحی UI**

### **با تصویر:**
```
┌─────────────────────┐
│   [Image 48px]      │
│   ⭐ برگزیده (badge)│
├─────────────────────┤
│   نام تأمین‌کننده   │
│   اطلاعات...        │
└─────────────────────┘
```

### **بدون تصویر:**
```
┌─────────────────────┐
│ ⭐ نام تأمین‌کننده  │
│   اطلاعات...        │
└─────────────────────┘
```

---

## 🚀 **مراحل بعدی**

1. **ویرایش تأمین‌کننده:** اضافه کردن ImageUpload به `EditSupplier.tsx`
2. **محصولات:** اضافه کردن به فرم‌های محصول
3. **چند تصویر:** پشتیبانی از آپلود چند تصویر برای محصولات
4. **بهینه‌سازی:** Resize و compress تصاویر
5. **CDN:** انتقال تصاویر به CDN

---

## 📝 **نکات مهم**

1. **امنیت:**
   - فقط کاربران احراز هویت شده می‌توانند آپلود کنند
   - اعتبارسنجی نوع فایل در سمت سرور
   - محدودیت حجم فایل

2. **عملکرد:**
   - تصاویر روی سرور ذخیره می‌شوند
   - Static file serving برای سرعت بالا
   - Lazy loading برای تصاویر

3. **تجربه کاربری:**
   - پیش‌نمایش لحظه‌ای
   - پیام‌های خطای فارسی
   - دکمه حذف آسان
   - Drag & drop support

---

**تاریخ:** 2024-11-13  
**نسخه:** 1.0.0  
**وضعیت:** ✅ آماده برای استفاده
