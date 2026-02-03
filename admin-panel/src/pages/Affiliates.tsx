import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2, Link2, Plus, Pencil, Trash2, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AffiliateRow {
  id: number;
  name: string;
  username: string;
  referral_code: string;
  balance: number;
  total_earnings: number;
  is_active: boolean;
  last_login: string | null;
  login_count: number;
  created_at: string;
}

export default function Affiliates() {
  const [list, setList] = useState<AffiliateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<AffiliateRow | null>(null);
  const [addName, setAddName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editBalance, setEditBalance] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAffiliates({ page, per_page: perPage });
      const data = res?.data ?? res;
      const affiliates = data?.affiliates ?? [];
      setList(affiliates.map((a: any) => ({
        id: a.id,
        name: a.name ?? '',
        username: a.username ?? '',
        referral_code: a.referral_code ?? '',
        balance: Number(a.balance) ?? 0,
        total_earnings: Number(a.total_earnings) ?? 0,
        is_active: a.is_active ?? true,
        last_login: a.last_login ?? null,
        login_count: a.login_count ?? 0,
        created_at: a.created_at ?? '',
      })));
      setTotal(Number(data?.total ?? 0));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'بارگذاری افیلیت‌ها ناموفق بود' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const openEdit = (row: AffiliateRow) => {
    setSelected(row);
    setEditName(row.name);
    setEditPassword('');
    setEditIsActive(row.is_active);
    setEditBalance(String(row.balance));
    setEditOpen(true);
  };

  const openDelete = (row: AffiliateRow) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const handleAdd = async () => {
    if (!addName.trim() || !addUsername.trim() || !addPassword || addPassword.length < 6) {
      toast({ variant: 'destructive', title: 'خطا', description: 'نام، نام کاربری و رمز عبور (حداقل ۶ کاراکتر) الزامی است' });
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createAffiliate({ name: addName.trim(), username: addUsername.trim(), password: addPassword });
      toast({ title: 'افزوده شد', description: 'افیلیت با موفقیت ایجاد شد' });
      setAddOpen(false);
      setAddName('');
      setAddUsername('');
      setAddPassword('');
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'ایجاد افیلیت ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const payload: any = { name: editName.trim(), is_active: editIsActive };
      if (editPassword.length >= 6) payload.password = editPassword;
      const bal = parseFloat(editBalance);
      if (!isNaN(bal) && bal >= 0) payload.balance = bal;
      await adminApi.updateAffiliate(selected.id, payload);
      toast({ title: 'به‌روزرسانی شد', description: 'افیلیت با موفقیت به‌روزرسانی شد' });
      setEditOpen(false);
      setSelected(null);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'به‌روزرسانی ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.deleteAffiliate(selected.id);
      toast({ title: 'حذف شد', description: 'افیلیت با موفقیت حذف شد' });
      setDeleteOpen(false);
      setSelected(null);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'حذف ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferralLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const mainOrigin = origin.includes('admin.') ? origin.replace('admin.', '') : origin;
    const url = `${mainOrigin || 'https://asllmarket.com'}/signup?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast({ title: 'کپی شد', description: 'لینک افیلیت کپی شد' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت افیلیت‌ها</h1>
            <p className="text-sm text-muted-foreground">افزودن و مدیریت کاربران پنل افیلیت (لینک اختصاصی و ورود به پنل افیلیت)</p>
          </div>
          <Button onClick={() => { setAddOpen(true); setAddName(''); setAddUsername(''); setAddPassword(''); }}>
            <Plus className="w-4 h-4 ml-2" />
            افیلیت جدید
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              لیست افیلیت‌ها ({total})
            </CardTitle>
            <CardDescription>همان ساختار مدیران پنل وب؛ هر افیلیت با یوزرنیم و پسورد وارد پنل افیلیت می‌شود.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : list.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">افیلیتی ثبت نشده است.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right py-3 px-2">نام</th>
                        <th className="text-right py-3 px-2">نام کاربری</th>
                        <th className="text-right py-3 px-2">کد معرف</th>
                        <th className="text-right py-3 px-2">موجودی</th>
                        <th className="text-right py-3 px-2">وضعیت</th>
                        <th className="text-right py-3 px-2">تاریخ ایجاد</th>
                        <th className="text-right py-3 px-2">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((row) => (
                        <tr key={row.id} className="border-b border-border/50">
                          <td className="py-2 px-2">{row.name}</td>
                          <td className="py-2 px-2 font-mono">{row.username}</td>
                          <td className="py-2 px-2">
                            <code className="bg-muted px-1 rounded">{row.referral_code}</code>
                            <Button variant="ghost" size="icon" className="h-8 w-8 inline-flex mr-1" onClick={() => copyReferralLink(row.referral_code)}>
                              {copiedCode === row.referral_code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </td>
                          <td className="py-2 px-2">{row.balance.toLocaleString('fa-IR')}</td>
                          <td className="py-2 px-2">
                            <span className={row.is_active ? 'text-green-600' : 'text-muted-foreground'}>{row.is_active ? 'فعال' : 'غیرفعال'}</span>
                          </td>
                          <td className="py-2 px-2">{row.created_at ? new Date(row.created_at).toLocaleDateString('fa-IR') : '—'}</td>
                          <td className="py-2 px-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDelete(row)}><Trash2 className="w-4 h-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</Button>
                    <span className="px-3 py-2 text-muted-foreground">{page} از {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>افیلیت جدید</DialogTitle>
            <DialogDescription>نام، نام کاربری و رمز عبور را وارد کنید. کد معرف به صورت خودکار ساخته می‌شود.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نام</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="نام افیلیت" />
            </div>
            <div className="space-y-2">
              <Label>نام کاربری (برای ورود به پنل افیلیت)</Label>
              <Input value={addUsername} onChange={(e) => setAddUsername(e.target.value)} placeholder="username" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>رمز عبور (حداقل ۶ کاراکتر)</Label>
              <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="••••••••" dir="ltr" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>انصراف</Button>
            <Button onClick={handleAdd} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش افیلیت</DialogTitle>
            <DialogDescription>تغییر نام، رمز عبور، وضعیت یا موجودی.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>نام</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>رمز عبور جدید (خالی = بدون تغییر)</Label>
                <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="••••••••" dir="ltr" />
              </div>
              <div className="flex items-center justify-between">
                <Label>فعال</Label>
                <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
              </div>
              <div className="space-y-2">
                <Label>موجودی (تومان)</Label>
                <Input type="number" min={0} value={editBalance} onChange={(e) => setEditBalance(e.target.value)} dir="ltr" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>انصراف</Button>
            <Button onClick={handleEdit} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف افیلیت</DialogTitle>
            <DialogDescription>آیا از حذف «{selected?.name}» اطمینان دارید؟ این عمل قابل بازگشت نیست.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>انصراف</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
