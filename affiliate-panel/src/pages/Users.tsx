import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users as UsersIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { affiliateApi } from "@/lib/affiliateApi";

type RegisteredUser = { id: number; name: string; phone: string; registered_at: string; created_at: string };

export default function Users() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const perPage = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await affiliateApi.getRegisteredUsers({ page, per_page: perPage });
      const list = Array.isArray(res?.users) ? res.users : Array.isArray((res as { items?: unknown[] })?.items) ? (res as { items: RegisteredUser[] }).items : [];
      setUsers(list);
      setTotal(Number(res?.total ?? 0));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "خطا در بارگذاری لیست ثبت‌نامی";
      setError(msg);
      toast.error(msg);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لیست ثبت‌نامی</h1>
        <p className="text-muted-foreground">همان لیستی که پشتیبانی برای شما در پنل مدیریت ثبت کرده است</p>
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            ثبت‌نام‌ها ({total.toLocaleString("fa-IR")})
          </CardTitle>
          <CardDescription>کاربران معرفی‌شده توسط شما (ارسال‌شده از طرف پشتیبانی)</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">اگر پشتیبانی لیست ثبت‌نامی برای شما آپلود کرده، لطفاً یک بار دیگر بارگذاری کنید یا با پشتیبانی تماس بگیرید.</p>
              </div>
              <button type="button" onClick={() => load()} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4" />
                تلاش مجدد
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 && !error ? (
            <p className="text-muted-foreground text-center py-12">هنوز کاربری در لیست ثبت‌نامی شما ثبت نشده است.</p>
          ) : users.length > 0 ? (
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
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border/50">
                        <td className="py-2 px-2">{u.name}</td>
                        <td className="py-2 px-2">{u.phone || "—"}</td>
                        <td className="py-2 px-2">{u.registered_at ? new Date(u.registered_at).toLocaleDateString("fa-IR") : (u.created_at ? new Date(u.created_at).toLocaleDateString("fa-IR") : "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button type="button" className="px-3 py-1 rounded border border-border disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</button>
                  <span className="px-3 py-1 text-muted-foreground">{page} از {totalPages}</span>
                  <button type="button" className="px-3 py-1 rounded border border-border disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>بعدی</button>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
