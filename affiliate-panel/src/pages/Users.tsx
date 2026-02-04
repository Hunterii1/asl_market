import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users as UsersIcon, Loader2 } from "lucide-react";
import { affiliateApi } from "@/lib/affiliateApi";

type RegisteredUser = { id: number; name: string; phone: string; registered_at: string; created_at: string };

export default function Users() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 50;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await affiliateApi.getRegisteredUsers({ page, per_page: perPage });
        if (!cancelled) {
          setUsers(res?.users ?? []);
          setTotal(Number(res?.total ?? 0));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page]);

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
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">هنوز کاربری در لیست ثبت‌نامی شما ثبت نشده است.</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
