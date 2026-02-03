import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CreditCard, Loader2, UserCheck } from "lucide-react";
import { affiliateApi } from "@/services/affiliateApi";

export default function AffiliatePayments() {
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await affiliateApi.getPayments();
        if (!cancelled) {
          setSalesChart(res?.sales_chart ?? []);
          setUsersList(res?.users_who_purchased ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const chartData = (salesChart || []).map((d: any) => ({ ...d, sales: Number(d.sales) ?? Number(d.count) ?? 0 }));

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پرداخت‌ها</h1>
        <p className="text-muted-foreground">نمودار فروش و لیست کاربران خریدار</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            نمودار فروش
          </CardTitle>
          <CardDescription>۳۰ روز گذشته</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">داده‌ای موجود نیست.</p>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v?.toLocaleString?.("fa-IR"), "فروش"]} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            کاربرانی که خرید کرده‌اند
          </CardTitle>
          <CardDescription>همان لیست داشبورد</CardDescription>
        </CardHeader>
        <CardContent>
          {usersList.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">کاربری با خرید ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-2">نام</th>
                    <th className="text-right py-3 px-2">تماس</th>
                    <th className="text-right py-3 px-2">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
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
