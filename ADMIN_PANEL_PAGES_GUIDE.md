# 📋 راهنمای استفاده از صفحات ادمین در پروژه ادمین پنل

## 📁 فایل‌های آماده برای انتقال

این فایل‌ها در پوشه `src/pages/admin/` قرار دارند و آماده انتقال به پروژه ادمین پنل هستند:

```
src/pages/admin/
├── AdminChats.tsx                  # مدیریت چت‌های مچینگ و ویزیتوری
├── AdminMatchingRequests.tsx       # مدیریت درخواست‌های مچینگ
└── AdminVisitorProjects.tsx        # مدیریت پروژه‌های ویزیتوری
```

## 🔌 API Endpoints مورد نیاز

این صفحات به این endpoints نیاز دارند (در backend موجود هستند):

### Matching Requests:
```
GET /api/v1/admin/matching/requests
GET /api/v1/admin/matching/requests/stats
GET /api/v1/admin/matching/chats
GET /api/v1/admin/matching/chats/:id/messages
```

### Visitor Projects:
```
GET /api/v1/admin/visitor-projects
GET /api/v1/admin/visitor-projects/stats
GET /api/v1/admin/visitor-projects/chats
GET /api/v1/admin/visitor-projects/chats/:id/messages
```

## 📦 وابستگی‌ها

این فایل‌ها به این کامپوننت‌ها نیاز دارند (باید در پروژه ادمین کپی شوند):

```typescript
// UI Components (shadcn)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Icons
import { MessageCircle, TrendingUp, Package, Users, etc... } from "lucide-react";

// Utils
import { toast } from "@/hooks/use-toast";
import { getImageUrl } from "@/utils/imageUrl";
```

## 🚀 نحوه استفاده در پروژه ادمین پنل

### مرحله 1: کپی فایل‌ها
```bash
# از پروژه اصلی
cp -r /path/to/asl_market/src/pages/admin/* /path/to/admin_panel/src/pages/

# یا دستی کپی کنید
```

### مرحله 2: Routes در ادمین پنل

```tsx
// در App.tsx پروژه ادمین پنل
import AdminMatchingRequests from "./pages/AdminMatchingRequests";
import AdminVisitorProjects from "./pages/AdminVisitorProjects";
import AdminChats from "./pages/AdminChats";

// Routes
<Route path="/matching-requests" element={<AdminMatchingRequests />} />
<Route path="/visitor-projects" element={<AdminVisitorProjects />} />
<Route path="/chats" element={<AdminChats />} />
```

### مرحله 3: منوی ادمین پنل

```tsx
const adminMenuItems = [
  {
    title: "درخواست‌های مچینگ",
    path: "/matching-requests",
    icon: TrendingUp,
  },
  {
    title: "پروژه‌های ویزیتوری",
    path: "/visitor-projects",
    icon: Package,
  },
  {
    title: "چت‌ها",
    path: "/chats",
    icon: MessageCircle,
  },
];
```

## ⚙️ تنظیمات API

این صفحات از `apiService` استفاده می‌کنند. در پروژه ادمین پنل:

```typescript
// api.ts در پروژه ادمین
const API_BASE_URL = "https://asllmarket.com/backend/api/v1";
// یا
const API_BASE_URL = "/api/v1"; // اگر از proxy استفاده می‌کنید
```

## 🔐 Authentication

این صفحات نیاز به authentication دارند:

```typescript
headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`
}
```

## 📊 ویژگی‌های صفحات

### AdminMatchingRequests.tsx:
- نمایش آمار کلی (کل، فعال، پذیرفته شده، منقضی، مختوم)
- فیلتر بر اساس status
- جستجو در محصولات و تأمین‌کننده‌ها
- Pagination
- نمایش جزئیات هر درخواست
- لینک به پروفایل تأمین‌کننده

### AdminVisitorProjects.tsx:
- نمایش آمار کلی پروژه‌ها
- فیلتر بر اساس status
- جستجو در محصولات و ویزیتورها
- Pagination
- نمایش پیشنهادها
- لینک به پروفایل ویزیتور

### AdminChats.tsx:
- دو تب: چت‌های مچینگ + چت‌های پروژه‌های ویزیتوری
- لیست چت‌ها با last message preview
- Dialog برای مشاهده تمام پیام‌ها
- نمایش sender info و timestamp
- فیلتر بر اساس status

## 🎨 استایل‌ها

این صفحات از theme system فعلی استفاده می‌کنند:
- Dark mode با gradient backgrounds
- Orange to Purple color scheme
- Rounded-3xl cards
- Responsive design (mobile-first)

## ✅ چک‌لیست انتقال

- [ ] کپی سه فایل admin از پوشه `src/pages/admin/`
- [ ] اضافه کردن Routes در App.tsx ادمین پنل
- [ ] اضافه کردن منوی ناوبری
- [ ] تست API endpoints
- [ ] تست authentication
- [ ] تست UI در موبایل و دسکتاپ
- [ ] حذف یا نگه‌داشتن فایل‌های admin از پروژه اصلی (اختیاری)

## 🔜 توصیه

در پروژه اصلی `asl_market`:
- این فایل‌ها فعلاً در `src/pages/admin/` باقی می‌مانند
- Routes ندارند، پس در UI نمایش داده نمی‌شوند
- می‌توانید برای backup نگهشان دارید
- در صورت نیاز می‌توانید حذف کنید

---

**توجه**: Backend APIs برای ادمین در `backend/controllers/admin_matching_controller.go` هستند و در هر دو پروژه (اصلی و ادمین پنل) قابل استفاده‌اند.
