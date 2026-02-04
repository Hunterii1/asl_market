import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, UserCheck } from "lucide-react";
import { affiliateApi } from "@/lib/affiliateApi";
import { PaymentsChart } from "@/components/PaymentsChart";

export default function Payments() {
  const [paymentsChart, setPaymentsChart] = useState<{ name: string; amount: number; count?: number }[]>([]);
  const [usersList, setUsersList] = useState<{ id: number; name: string; phone: string; purchased_at: string; created_at: string; amount_toman?: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await affiliateApi.getPayments();
        if (!cancelled) {
          const raw = res?.payments_chart ?? [];
          let chartData = raw.map((d: { name: string; amount?: number; count?: number }) => ({ name: d.name, amount: Number(d.amount ?? d.count ?? 0) || 0 }));
          const buyers = res?.confirmed_buyers ?? [];
          setUsersList(buyers);
          // اگر بک‌اند payments_chart خالی فرستاد ولی لیست خریداران داریم، نمودار را از همان لیست بساز
          if (chartData.length === 0 && buyers.length > 0) {
            const dayTotals: Record<string, number> = {};
            const defaultAmount = 6_000_000;
            for (const u of buyers) {
              const dateStr = u.purchased_at?.slice(0, 10) || (u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : "");
              if (dateStr) {
                const amt = (u.amount_toman && u.amount_toman > 0) ? u.amount_toman : defaultAmount;
                dayTotals[dateStr] = (dayTotals[dateStr] ?? 0) + amt;
              }
            }
            chartData = Object.entries(dayTotals)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([name, amount]) => ({ name, amount }));
          }
          setPaymentsChart(chartData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پرداخت‌ها</h1>
        <p className="text-muted-foreground">نمودار پرداخت و لیست خریداران تأییدشده (هر پرداخت بدون مبلغ = ۶ میلیون تومان)</p>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            نمودار پرداخت
          </CardTitle>
          <CardDescription>پرداخت‌های تأییدشده بر اساس روز (۹۰ روز گذشته) — مشابه نمودار ثبت‌نام‌ها</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paymentsChart.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">داده‌ای برای نمودار موجود نیست. پس از تأیید خریداران در پنل مدیریت، اینجا نمایش داده می‌شود.</p>
          ) : (
            <PaymentsChart data={paymentsChart} />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            کاربرانی که خرید کرده‌اند
          </CardTitle>
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
                    <th className="text-right py-3 px-2">مبلغ (تومان)</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{u.name}</td>
                      <td className="py-2 px-2">{u.phone || "—"}</td>
                      <td className="py-2 px-2">{u.purchased_at ? new Date(u.purchased_at).toLocaleDateString("fa-IR") : (u.created_at ? new Date(u.created_at).toLocaleDateString("fa-IR") : "—")}</td>
                      <td className="py-2 px-2">{((u.amount_toman && u.amount_toman > 0) ? u.amount_toman : 6_000_000).toLocaleString("fa-IR")}</td>
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
