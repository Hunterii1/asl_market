import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Wallet, Copy, Check, Link2, Loader2, UserCheck, FileText, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { RegisteredUsersChart } from "@/components/RegisteredUsersChart";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { affiliateApi } from "@/lib/affiliateApi";

const REGISTERED_PER_PAGE = 50;
type RegisteredUser = { id: number; name: string; phone: string; registered_at: string; created_at: string };

export default function Dashboard() {
  const [data, setData] = useState<{
    referral_link: string;
    referral_code?: string;
    total_signups: number;
    real_income?: number;
    total_income: number;
    balance: number;
    registrations_chart: { name: string; count: number }[];
    sales_chart: { name: string; sales: number }[];
    confirmed_buyers?: { id: number; name: string; phone: string; purchased_at: string; created_at: string; amount_toman?: number }[];
    registered_users?: RegisteredUser[];
    total_registered_users?: number;
    registered_users_chart?: { name: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [registeredList, setRegisteredList] = useState<RegisteredUser[]>([]);
  const [registeredTotal, setRegisteredTotal] = useState(0);
  const [registeredPage, setRegisteredPage] = useState(1);
  const [registeredListLoading, setRegisteredListLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await affiliateApi.getDashboard();
        if (!cancelled) setData(res);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "بارگذاری داشبورد ناموفق بود");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadRegisteredPage = useCallback(async (page: number) => {
    setRegisteredListLoading(true);
    try {
      const res = await affiliateApi.getRegisteredUsers({ page, per_page: REGISTERED_PER_PAGE });
      const users = Array.isArray(res?.users) ? res.users : [];
      const tot = Number(res?.total ?? 0);
      setRegisteredList(users);
      setRegisteredTotal(tot);
      setRegisteredPage(page);
    } catch {
      setRegisteredList([]);
      setRegisteredTotal(0);
    } finally {
      setRegisteredListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data || (data.total_registered_users ?? 0) === 0) return;
    loadRegisteredPage(1);
  }, [data?.total_registered_users, loadRegisteredPage]);

  const copyLink = () => {
    if (!data?.referral_link || data.referral_link === '') return;
    navigator.clipboard.writeText(data.referral_link);
    setCopied(true);
    toast.success("لینک افیلیت کپی شد");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  // اگر API درآمد ۰ برگرداند ولی لیست خریداران داریم، از همان لیست محاسبه کن (هر خریدار = ۶ میلیون یا amount_toman)
  const realIncomeFromApi = Number(data.real_income ?? 0);
  const totalIncomeFromApi = Number(data.total_income ?? 0);
  const buyers = data.confirmed_buyers ?? [];
  const computedRealIncome = buyers.reduce((sum, b) => {
    const amt = (b.amount_toman && b.amount_toman > 0) ? b.amount_toman : 6_000_000;
    return sum + amt;
  }, 0);
  const realIncomeDisplay = realIncomeFromApi > 0 ? realIncomeFromApi : computedRealIncome;
  const totalIncomeDisplay = totalIncomeFromApi > 0 ? totalIncomeFromApi : realIncomeDisplay;

  const regChart = (data.registrations_chart || []).map((d: { name: string; count?: number }) => ({ ...d, count: Number(d.count) || 0 }));
  const salesChart = (data.sales_chart || []).map((d: { name: string; sales?: number; count?: number }) => ({ ...d, sales: Number(d.sales) || Number((d as { count?: number }).count) || 0 }));

  // نمودار ثبت‌نامی: از API یا از روی لیست کاربران (گروه‌بندی بر اساس روز)
  const registeredChartRaw = data.registered_users_chart ?? [];
  const registeredChartFromList = (() => {
    if (registeredChartRaw.length > 0) return registeredChartRaw;
    const list = data.registered_users ?? [];
    const byDate: Record<string, number> = {};
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 90);
    for (const u of list) {
      const dateStr = u.registered_at || u.created_at;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      if (d < cutoff) continue;
      const key = d.toISOString().slice(0, 10);
      byDate[key] = (byDate[key] ?? 0) + 1;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  })();

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
        <p className="text-muted-foreground">خلاصه عملکرد و لینک اختصاصی شما</p>
      </div>

      <Card className="rounded-2xl border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            لینک اختصاصی افیلیت
          </CardTitle>
          <CardDescription>این لینک را با دیگران به اشتراک بگذارید.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input readOnly value={data.referral_link && data.referral_link.trim() !== "" ? data.referral_link : "درحال آماده سازی لینک شما..."} className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm font-mono text-left dir-ltr" dir="ltr" />
            {data.referral_link && data.referral_link.trim() !== "" && (
              <Button onClick={copyLink} className="shrink-0">
                {copied ? <Check className="w-4 h-4 ml-2" /> : <Copy className="w-4 h-4 ml-2" />}
                {copied ? "کپی شد" : "کپی لینک"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تعداد کل ثبت‌نام‌ها</p>
                <p className="text-3xl font-bold text-foreground mt-1">{(data.total_registered_users ?? data.total_signups ?? 0).toLocaleString("fa-IR")}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">درآمد واقعی</p>
                <p className="text-3xl font-bold text-foreground mt-1">{realIncomeDisplay.toLocaleString("fa-IR")} <span className="text-sm font-normal text-muted-foreground">تومان</span></p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Wallet className="w-7 h-7 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">درآمد کل</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalIncomeDisplay.toLocaleString("fa-IR")} <span className="text-sm font-normal text-muted-foreground">تومان</span></p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {regChart.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>نمودار ثبت‌نام‌ها (۳۰ روز گذشته)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={regChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v?.toLocaleString?.("fa-IR"), "تعداد"]} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {salesChart.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>نمودار فروش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v?.toLocaleString?.("fa-IR"), "فروش"]} />
                  <Area type="monotone" dataKey="sales" stroke="rgb(34, 197, 94)" fill="rgba(34, 197, 94, 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نمودار ثبت‌نامی‌ها در روزهای مختلف (لیست پشتیبانی) — بالای لیست ثبت‌نامی */}
      <Card className="rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            نمودار ثبت‌نام‌ها (بر اساس روز)
          </CardTitle>
          <CardDescription>تعداد ثبت‌نام‌های لیست پشتیبانی در ۹۰ روز گذشته</CardDescription>
        </CardHeader>
        <CardContent>
          {registeredChartFromList.length > 0 ? (
            <RegisteredUsersChart data={registeredChartFromList} />
          ) : (
            <p className="text-muted-foreground text-center py-12">در ۹۰ روز گذشته داده‌ای برای نمودار ثبت نشده است.</p>
          )}
        </CardContent>
      </Card>

      {/* لیست ثبت‌نامی (۵۰ نفر در هر صفحه، صفحه‌بندی) */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            لیست ثبت‌نامی (ارسال‌شده توسط پشتیبانی)
          </CardTitle>
          <CardDescription>
            {(data.total_registered_users ?? 0) > 0
              ? `${Number(data.total_registered_users).toLocaleString("fa-IR")} نفر — `
              : ""}
            <Link to="/users" className="text-primary underline">مشاهده همه</Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(data.total_registered_users ?? 0) === 0 ? (
            <p className="text-muted-foreground text-center py-8">هنوز کاربری در لیست ثبت‌نامی شما ثبت نشده است.</p>
          ) : registeredListLoading && registeredList.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-2">نام</th>
                      <th className="text-right py-3 px-2">موبایل</th>
                      <th className="text-right py-3 px-2">تاریخ ثبت‌نام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredList.map((u) => (
                      <tr key={u.id} className="border-b border-border/50">
                        <td className="py-2 px-2">{u.name}</td>
                        <td className="py-2 px-2">{u.phone || "—"}</td>
                        <td className="py-2 px-2">{u.registered_at ? new Date(u.registered_at).toLocaleDateString("fa-IR") : (u.created_at ? new Date(u.created_at).toLocaleDateString("fa-IR") : "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {registeredTotal > REGISTERED_PER_PAGE && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Pagination
                    page={registeredPage}
                    total={registeredTotal}
                    perPage={REGISTERED_PER_PAGE}
                    onPageChange={loadRegisteredPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            کاربرانی که خرید کرده‌اند
          </CardTitle>
          <CardDescription>همان لیستی که در بخش مدیریت افیلیت از «لیست فروش» تطبیق و تأیید شده است</CardDescription>
        </CardHeader>
        <CardContent>
          {(data.confirmed_buyers?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-center py-8">هنوز خریدی تأیید نشده است. پس از تطبیق و تأیید در پنل مدیریت، اینجا نمایش داده می‌شود.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-2">نام</th>
                    <th className="text-right py-3 px-2">تماس</th>
                    <th className="text-right py-3 px-2">تاریخ خرید</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.confirmed_buyers ?? []).map((u) => (
                    <tr key={u.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{u.name}</td>
                      <td className="py-2 px-2">{u.phone || "—"}</td>
                      <td className="py-2 px-2">{u.purchased_at ? new Date(u.purchased_at).toLocaleDateString("fa-IR") : (u.created_at ? new Date(u.created_at).toLocaleDateString("fa-IR") : "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
