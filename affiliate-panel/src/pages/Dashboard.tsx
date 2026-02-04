import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Wallet, Copy, Check, Link2, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { affiliateApi } from "@/lib/affiliateApi";

export default function Dashboard() {
  const [data, setData] = useState<{
    referral_link: string;
    referral_code?: string;
    total_signups: number;
    total_income: number;
    balance: number;
    registrations_chart: { name: string; count: number }[];
    sales_chart: { name: string; sales: number }[];
    users_who_purchased: { id: number; first_name: string; last_name: string; email: string; phone: string; created_at: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const regChart = (data.registrations_chart || []).map((d: { name: string; count?: number }) => ({ ...d, count: Number(d.count) || 0 }));
  const salesChart = (data.sales_chart || []).map((d: { name: string; sales?: number; count?: number }) => ({ ...d, sales: Number(d.sales) || Number((d as { count?: number }).count) || 0 }));

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تعداد کل ثبت‌نام‌ها</p>
                <p className="text-3xl font-bold text-foreground mt-1">{(data.total_signups ?? 0).toLocaleString("fa-IR")}</p>
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
                <p className="text-sm text-muted-foreground">درآمد کل</p>
                <p className="text-3xl font-bold text-foreground mt-1">{(data.total_income ?? 0).toLocaleString("fa-IR")} <span className="text-sm font-normal text-muted-foreground">تومان</span></p>
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

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            کاربرانی که خرید کرده‌اند
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data.users_who_purchased?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-center py-8">هنوز کاربری با خرید ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-2">نام</th>
                    <th className="text-right py-3 px-2">تماس</th>
                    <th className="text-right py-3 px-2">تاریخ ثبت‌نام</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users_who_purchased.map((u) => (
                    <tr key={u.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{u.first_name} {u.last_name}</td>
                      <td className="py-2 px-2">{u.phone || u.email || "—"}</td>
                      <td className="py-2 px-2">{u.created_at ? new Date(u.created_at).toLocaleDateString("fa-IR") : "—"}</td>
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
