import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { affiliateApi, getAffiliateUser } from "@/lib/affiliateApi";

export default function Withdrawals() {
  const [requests, setRequests] = useState<{ id: number; amount: number; status: string; requested_at: string }[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankCardNumber, setBankCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [shebaNumber, setShebaNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const user = getAffiliateUser();
  const balance = user?.balance ?? 0;

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await affiliateApi.getWithdrawalRequests({ page, per_page: 10 });
      setRequests(res?.requests ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/,/g, ""));
    if (!num || num <= 0) {
      toast.error("مبلغ معتبر وارد کنید");
      return;
    }
    if (num > balance) {
      toast.error("مبلغ بیشتر از موجودی است");
      return;
    }
    setSubmitting(true);
    try {
      await affiliateApi.createWithdrawalRequest({
        amount: num,
        bank_card_number: bankCardNumber || undefined,
        card_holder_name: cardHolderName || undefined,
        sheba_number: shebaNumber || undefined,
        bank_name: bankName || undefined,
      });
      toast.success("درخواست برداشت با موفقیت ثبت شد");
      setAmount("");
      setBankCardNumber("");
      setCardHolderName("");
      setShebaNumber("");
      setBankName("");
      loadRequests();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ثبت درخواست ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel: Record<string, string> = {
    pending: "در انتظار",
    approved: "تأیید شده",
    processing: "در حال پردازش",
    completed: "تکمیل شده",
    rejected: "رد شده",
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">درخواست برداشت</h1>
        <p className="text-muted-foreground">موجودی قابل برداشت و ثبت درخواست جدید</p>
      </div>

      <Card className="rounded-2xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            موجودی قابل برداشت
          </CardTitle>
          <CardDescription>مبلغی که می‌توانید درخواست برداشت دهید</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">{balance.toLocaleString("fa-IR")} <span className="text-base font-normal text-muted-foreground">تومان</span></p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>ثبت درخواست برداشت</CardTitle>
          <CardDescription>مبلغ و اطلاعات بانکی را وارد کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>مبلغ (تومان)</Label>
              <Input type="text" placeholder="مثال: 500000" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={submitting} className="text-left dir-ltr" />
            </div>
            <div className="space-y-2">
              <Label>شماره کارت</Label>
              <Input type="text" placeholder="۱۶ رقم" value={bankCardNumber} onChange={(e) => setBankCardNumber(e.target.value)} disabled={submitting} className="text-left dir-ltr" />
            </div>
            <div className="space-y-2">
              <Label>نام صاحب کارت</Label>
              <Input type="text" placeholder="نام و نام خانوادگی" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>شماره شبا</Label>
              <Input type="text" placeholder="IR..." value={shebaNumber} onChange={(e) => setShebaNumber(e.target.value)} disabled={submitting} className="text-left dir-ltr" />
            </div>
            <div className="space-y-2">
              <Label>نام بانک</Label>
              <Input type="text" placeholder="مثال: ملی" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={submitting} />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
              ثبت درخواست برداشت
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>تاریخچه درخواست‌های برداشت</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">درخواستی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-2">مبلغ</th>
                    <th className="text-right py-3 px-2">وضعیت</th>
                    <th className="text-right py-3 px-2">تاریخ درخواست</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{Number(r.amount).toLocaleString("fa-IR")} تومان</td>
                      <td className="py-2 px-2">{statusLabel[r.status] ?? r.status}</td>
                      <td className="py-2 px-2">{r.requested_at ? new Date(r.requested_at).toLocaleDateString("fa-IR") : "—"}</td>
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
