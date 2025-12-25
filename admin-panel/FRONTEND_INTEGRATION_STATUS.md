# وضعیت اتصال Frontend به Backend

## ✅ صفحات متصل شده

### 1. Dashboard (`src/pages/Dashboard.tsx`)
- ✅ متصل به `adminApi.getDashboardStats()`
- ✅ نمایش آمار واقعی از API
- ✅ Loading state اضافه شده

### 2. Users (`src/pages/Users.tsx`)
- ✅ متصل به `adminApi.getUsers()`
- ✅ متصل به `adminApi.deleteUser()`
- ✅ Pagination از API
- ✅ Search و Filter از API
- ⚠️ نیاز به اتصال `updateUserStatus` برای تغییر وضعیت کاربر

## 🔄 صفحات نیازمند اتصالش

### 3. Suppliers (`src/pages/Suppliers.tsx`)
**Endpoints موجود:**
- `adminApi.getSuppliers()` - ✅ آماده
- `adminApi.approveSupplier()` - ✅ آماده
- `adminApi.rejectSupplier()` - ✅ آماده
- `adminApi.updateSupplier()` - ⚠️ نیاز به بررسی
- `adminApi.deleteSupplier()` - ⚠️ نیاز به بررسی

**اقدامات لازم:**
```typescript
// در Suppliers.tsx اضافه کنید:
import { adminApi } from '@/lib/api/adminApi';
import { useEffect, useState } from 'react';

// در component:
const [suppliers, setSuppliers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSuppliers({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter,
      });
      setSuppliers(response.data?.suppliers || response.suppliers || []);
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در بارگذاری تأمین‌کنندگان' });
    } finally {
      setLoading(false);
    }
  };
  loadSuppliers();
}, [currentPage, itemsPerPage, statusFilter]);
```

### 4. Visitors (`src/pages/Visitors.tsx`)
**Endpoints موجود:**
- `adminApi.getVisitors()` - ✅ آماده
- `adminApi.approveVisitor()` - ✅ آماده
- `adminApi.rejectVisitor()` - ✅ آماده

**اقدامات لازم:** مشابه Suppliers

### 5. Licenses (`src/pages/Licenses.tsx`)
**Endpoints موجود:**
- `adminApi.getLicenses()` - ✅ آماده
- `adminApi.generateLicenses()` - ✅ آماده

**اقدامات لازم:**
```typescript
// در Licenses.tsx:
useEffect(() => {
  const loadLicenses = async () => {
    try {
      const response = await adminApi.getLicenses({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter, // 'used' | 'available' | 'all'
        type: typeFilter, // 'pro' | 'plus' | 'plus4'
      });
      setLicenses(response.data?.licenses || response.licenses || []);
    } catch (error) {
      // Handle error
    }
  };
  loadLicenses();
}, [currentPage, itemsPerPage, statusFilter, typeFilter]);
```

### 6. Withdrawals (`src/pages/Withdrawals.tsx`)
**Endpoints موجود:**
- `adminApi.getWithdrawals()` - ✅ آماده (توجه: endpoint واقعی `/admin/withdrawal/requests`)
- `adminApi.updateWithdrawalStatus()` - ✅ آماده
- `adminApi.getWithdrawalStats()` - ✅ آماده

**اقدامات لازم:**
```typescript
// در Withdrawals.tsx:
const handleApproveWithdrawal = async (id: number) => {
  try {
    await adminApi.updateWithdrawalStatus(id, {
      status: 'approved',
      destination_account: '...', // از فرم دریافت کنید
    });
    toast({ title: 'موفقیت', description: 'برداشت تأیید شد' });
    loadWithdrawals(); // Reload list
  } catch (error) {
    toast({ title: 'خطا', description: 'خطا در تأیید برداشت' });
  }
};
```

### 7. Tickets (`src/pages/Tickets.tsx`)
**Endpoints موجود:**
- `adminApi.getTickets()` - ✅ آماده
- `adminApi.getTicket()` - ✅ آماده
- `adminApi.updateTicketStatus()` - ✅ آماده
- `adminApi.addAdminMessageToTicket()` - ✅ آماده

**اقدامات لازم:**
```typescript
// در Tickets.tsx:
const handleRespondToTicket = async (ticketId: number, message: string) => {
  try {
    await adminApi.addAdminMessageToTicket(ticketId, { message });
    toast({ title: 'موفقیت', description: 'پیام ارسال شد' });
    loadTickets(); // Reload list
  } catch (error) {
    toast({ title: 'خطا', description: 'خطا در ارسال پیام' });
  }
};
```

### 8. Education (`src/pages/Education.tsx`)
**Endpoints موجود:**
- `adminApi.getTrainingVideos()` - ✅ آماده
- `adminApi.createTrainingVideo()` - ✅ آماده
- `adminApi.updateTrainingVideo()` - ✅ آماده
- `adminApi.deleteTrainingVideo()` - ✅ آماده
- `adminApi.getTrainingCategories()` - ✅ آماده
- `adminApi.createTrainingCategory()` - ✅ آماده

### 9. Products (`src/pages/Products.tsx`)
**Endpoints موجود:**
- `adminApi.getProducts()` - ✅ آماده
- `adminApi.createProduct()` - ✅ آماده
- `adminApi.updateProduct()` - ✅ آماده
- `adminApi.deleteProduct()` - ✅ آماده

### 10. Notifications (`src/pages/Notifications.tsx`)
**Endpoints موجود:**
- `adminApi.getNotifications()` - ✅ آماده (با فیلتر status و type)
- `adminApi.createNotification()` - ✅ آماده
- `adminApi.updateNotification()` - ✅ آماده
- `adminApi.deleteNotification()` - ✅ آماده
- `adminApi.getNotificationStats()` - ✅ آماده

### 11. Popups (`src/pages/Popups.tsx`)
**Endpoints موجود:**
- `adminApi.getPopups()` - ✅ آماده
- `adminApi.createPopup()` - ✅ آماده
- `adminApi.updatePopup()` - ✅ آماده
- `adminApi.deletePopup()` - ✅ آماده

## 📝 نکات مهم

### 1. Authentication
تمام درخواست‌ها باید با token احراز هویت شوند. `adminApi` به صورت خودکار token را از `localStorage` می‌خواند.

### 2. Error Handling
همیشه از try-catch استفاده کنید و خطاها را با toast نمایش دهید:

```typescript
try {
  const data = await adminApi.getUsers();
  // Handle success
} catch (error: any) {
  toast({
    title: 'خطا',
    description: error.message || 'خطا در درخواست',
    variant: 'destructive',
  });
}
```

### 3. Loading States
همیشه loading state را مدیریت کنید:

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      // Handle data
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### 4. Pagination
از pagination API استفاده کنید:

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [totalPages, setTotalPages] = useState(0);

const response = await adminApi.getUsers({
  page: currentPage,
  per_page: itemsPerPage,
});

setTotalPages(response.data?.total_pages || 1);
```

### 5. Response Format
پاسخ‌های API ممکن است در یکی از این فرمت‌ها باشند:
- `{ success: true, data: { users: [...], total: 100 } }`
- `{ users: [...], total: 100 }`
- `{ data: { users: [...], total: 100 } }`

همیشه هر دو حالت را بررسی کنید:
```typescript
const users = response.data?.users || response.users || [];
const total = response.data?.total || response.total || 0;
```

## 🚀 مراحل بعدی

1. ✅ Dashboard - متصل شده
2. ✅ Users - متصل شده
3. ⏳ Suppliers - نیاز به اتصال
4. ⏳ Visitors - نیاز به اتصال
5. ⏳ Licenses - نیاز به اتصال
6. ⏳ Withdrawals - نیاز به اتصال
7. ⏳ Tickets - نیاز به اتصال
8. ⏳ Education - نیاز به اتصال
9. ⏳ Products - نیاز به اتصال
10. ⏳ Notifications - نیاز به اتصال
11. ⏳ Popups - نیاز به اتصال

## 🔧 تست

برای تست هر صفحه:
1. مطمئن شوید که backend در حال اجرا است (`go run main.go`)
2. مطمئن شوید که admin-panel در حال اجرا است (`npm run dev`)
3. با یک کاربر admin وارد شوید
4. صفحه مورد نظر را باز کنید و عملیات CRUD را تست کنید

## 📌 مشکلات احتمالی

### مشکل: CORS Error
**راه حل:** مطمئن شوید که backend CORS را برای admin-panel فعال کرده است.

### مشکل: 401 Unauthorized
**راه حل:** 
- مطمئن شوید که token در localStorage ذخیره شده است
- بررسی کنید که token معتبر است
- دوباره وارد شوید

### مشکل: 404 Not Found
**راه حل:** 
- بررسی کنید که endpoint در routes.go تعریف شده است
- بررسی کنید که URL درست است

### مشکل: 500 Internal Server Error
**راه حل:** 
- لاگ‌های backend را بررسی کنید
- بررسی کنید که دیتابیس در دسترس است
- بررسی کنید که تمام فیلدهای مورد نیاز ارسال شده‌اند

