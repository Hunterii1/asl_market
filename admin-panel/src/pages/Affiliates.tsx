import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2, Link2, Plus, Pencil, Trash2, Copy, Check, Eye, Upload, FileText, Users, ShoppingCart } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

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

interface RegisteredUser {
  id: number;
  name: string;
  phone: string;
  registered_at: string;
  created_at: string;
}

interface Buyer {
  id: number;
  name: string;
  phone: string;
  purchased_at: string;
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
  const [detailOpen, setDetailOpen] = useState(false);
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
  
  // Detail modal states
  const [customReferralCode, setCustomReferralCode] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [salesListText, setSalesListText] = useState('');
  const [matchedBuyers, setMatchedBuyers] = useState<{ name: string; phone: string; registered_at: string }[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
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

  const openDetail = async (row: AffiliateRow) => {
    setSelected(row);
    setCustomReferralCode(row.referral_code);
    setCsvFile(null);
    setSalesListText('');
    setMatchedBuyers([]);
    setRegisteredUsers([]);
    setBuyers([]);
    setDetailOpen(true);
    // Load registered users and buyers
    loadRegisteredUsers(row.id);
    loadBuyers(row.id);
  };

  const loadRegisteredUsers = async (id: number) => {
    setLoadingRegistered(true);
    try {
      const res = await adminApi.getAffiliateRegisteredUsers(id, { page: 1, per_page: 100 });
      const data = res?.data ?? res;
      setRegisteredUsers(data?.items ?? []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: 'بارگذاری لیست ثبت‌نام‌ها ناموفق بود' });
    } finally {
      setLoadingRegistered(false);
    }
  };

  const loadBuyers = async (id: number) => {
    setLoadingBuyers(true);
    try {
      const res = await adminApi.getAffiliateBuyers(id, { page: 1, per_page: 100 });
      const data = res?.data ?? res;
      setBuyers(data?.items ?? []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: 'بارگذاری لیست خریداران ناموفق بود' });
    } finally {
      setLoadingBuyers(false);
    }
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

  const handleSaveReferralCode = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.updateAffiliate(selected.id, { referral_code: customReferralCode.trim() });
      toast({ title: 'ذخیره شد', description: 'لینک اختصاصی با موفقیت به‌روزرسانی شد' });
      load();
      if (selected) {
        const updated = list.find(a => a.id === selected.id);
        if (updated) {
          setSelected({ ...updated, referral_code: customReferralCode.trim() });
        }
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'ذخیره لینک ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportCSV = async () => {
    if (!selected || !csvFile) return;
    setSubmitting(true);
    try {
      await adminApi.importAffiliateRegisteredUsers(selected.id, csvFile);
      toast({ title: 'آپلود شد', description: 'لیست ثبت‌نام‌ها با موفقیت آپلود شد' });
      setCsvFile(null);
      loadRegisteredUsers(selected.id);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'آپلود CSV ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMatchSales = async () => {
    if (!selected || !salesListText.trim()) return;
    setSubmitting(true);
    try {
      // Parse CSV text: name,phone (one per line or CSV format)
      const lines = salesListText.trim().split('\n');
      const buyers: { name: string; phone: string }[] = [];
      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim().replace(/"/g, ''));
        if (parts.length >= 2) {
          buyers.push({ name: parts[0], phone: parts[1] });
        }
      }
      if (buyers.length === 0) {
        toast({ variant: 'destructive', title: 'خطا', description: 'فرمت لیست فروش نامعتبر است. باید name,phone باشد' });
        return;
      }
      const res = await adminApi.matchAffiliateSales(selected.id, buyers);
      const data = res?.data ?? res;
      setMatchedBuyers(data?.matched ?? []);
      toast({ title: 'جستجو انجام شد', description: `${data?.count ?? 0} خریدار مطابق یافت شد` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'جستجوی خریداران ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBuyers = async () => {
    if (!selected || matchedBuyers.length === 0) return;
    setSubmitting(true);
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      const dateStr = weekStart.toISOString().split('T')[0];
      await adminApi.confirmAffiliateBuyers(selected.id, matchedBuyers, dateStr);
      toast({ title: 'تایید شد', description: `${matchedBuyers.length} خریدار ثبت شد` });
      setMatchedBuyers([]);
      setSalesListText('');
      loadBuyers(selected.id);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'ثبت خریداران ناموفق بود' });
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

  const getReferralLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const mainOrigin = origin.includes('admin.') ? origin.replace('admin.', '') : origin;
    return `${mainOrigin || 'https://asllmarket.com'}/signup?ref=${code}`;
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
                        <tr key={row.id} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(row)}>
                          <td className="py-2 px-2">{row.name}</td>
                          <td className="py-2 px-2 font-mono">{row.username}</td>
                          <td className="py-2 px-2">
                            <code className="bg-muted px-1 rounded">{row.referral_code || '—'}</code>
                            {row.referral_code && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 inline-flex mr-1" onClick={(e) => { e.stopPropagation(); copyReferralLink(row.referral_code); }}>
                                {copiedCode === row.referral_code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            )}
                          </td>
                          <td className="py-2 px-2">{row.balance.toLocaleString('fa-IR')}</td>
                          <td className="py-2 px-2">
                            <span className={row.is_active ? 'text-green-600' : 'text-muted-foreground'}>{row.is_active ? 'فعال' : 'غیرفعال'}</span>
                          </td>
                          <td className="py-2 px-2">{row.created_at ? new Date(row.created_at).toLocaleDateString('fa-IR') : '—'}</td>
                          <td className="py-2 px-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetail(row); }}><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); openDelete(row); }}><Trash2 className="w-4 h-4" /></Button>
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

      {/* Detail Modal - Professional with Tabs */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">مدیریت افیلیت: {selected?.name}</DialogTitle>
            <DialogDescription>لینک اختصاصی، لیست ثبت‌نام‌ها، فروش و خریداران</DialogDescription>
          </DialogHeader>
          {selected && (
            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="link"><Link2 className="w-4 h-4 ml-1" /> لینک اختصاصی</TabsTrigger>
                <TabsTrigger value="registered"><Users className="w-4 h-4 ml-1" /> لیست ثبت‌نام‌ها</TabsTrigger>
                <TabsTrigger value="sales"><ShoppingCart className="w-4 h-4 ml-1" /> لیست فروش</TabsTrigger>
                <TabsTrigger value="buyers"><FileText className="w-4 h-4 ml-1" /> لیست خریداران</TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>لینک اختصاصی افیلیت</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={customReferralCode ? getReferralLink(customReferralCode) : 'درحال آماده سازی لینک شما...'}
                      className="flex-1 font-mono text-sm dir-ltr"
                      dir="ltr"
                    />
                    {customReferralCode && (
                      <Button variant="outline" onClick={() => copyReferralLink(customReferralCode)}>
                        <Copy className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>کد معرف (برای ویرایش)</Label>
                  <Input
                    value={customReferralCode}
                    onChange={(e) => setCustomReferralCode(e.target.value)}
                    placeholder="کد معرف را وارد کنید"
                    dir="ltr"
                  />
                </div>
                <Button onClick={handleSaveReferralCode} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  ذخیره لینک اختصاصی
                </Button>
              </TabsContent>

              <TabsContent value="registered" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>آپلود فایل CSV لیست ثبت‌نام‌ها</Label>
                  <p className="text-xs text-muted-foreground">فرمت: نام، شماره موبایل، تاریخ ثبت‌نام</p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={handleImportCSV} disabled={!csvFile || submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />}
                  آپلود و ذخیره
                </Button>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold mb-2">لیست ثبت‌نام‌ها ({registeredUsers.length})</h4>
                  {loadingRegistered ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : registeredUsers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">هنوز ثبت‌نامی ثبت نشده است</p>
                  ) : (
                    <div className="space-y-2">
                      {registeredUsers.map((u, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                          <span>{u.name}</span>
                          <span className="font-mono">{u.phone}</span>
                          <span className="text-muted-foreground">{u.registered_at || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sales" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>لیست فروش این هفته (CSV: name,phone)</Label>
                  <Textarea
                    value={salesListText}
                    onChange={(e) => setSalesListText(e.target.value)}
                    placeholder="نام,شماره موبایل&#10;علی احمدی,09123456789&#10;محمد رضایی,09187654321"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={handleMatchSales} disabled={!salesListText.trim() || submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  جستجو و تطبیق با لیست ثبت‌نام‌ها
                </Button>
                {matchedBuyers.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">لیست خریداران این شخص ({matchedBuyers.length})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {matchedBuyers.map((b, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                          <span>{b.name}</span>
                          <span className="font-mono">{b.phone}</span>
                          <span className="text-muted-foreground">{b.registered_at || '—'}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleConfirmBuyers} disabled={submitting} className="w-full mt-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}
                      تایید و ثبت خریداران
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="buyers" className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h4 className="font-semibold mb-2">لیست خریداران تایید شده ({buyers.length})</h4>
                  {loadingBuyers ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : buyers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">هنوز خریداری ثبت نشده است</p>
                  ) : (
                    <div className="space-y-2">
                      {buyers.map((b, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                          <span>{b.name}</span>
                          <span className="font-mono">{b.phone}</span>
                          <span className="text-muted-foreground">{b.purchased_at || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

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
