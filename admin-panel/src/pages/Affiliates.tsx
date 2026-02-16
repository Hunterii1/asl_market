import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2, Link2, Plus, Pencil, Trash2, Copy, Check, Eye, Upload, FileText, Users, ShoppingCart, Wallet, UserCheck, Percent, Banknote } from 'lucide-react';
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
  referral_link: string;
  balance: number;
  total_earnings: number;
  commission_percent: number;
  is_active: boolean;
  last_login: string | null;
  login_count: number;
  created_at: string;
  needs_withdrawal_followup?: boolean;
}

interface AffiliateStats {
  active_count: number;
  total_affiliate_income: number;
  total_leads: number;
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

interface WithdrawalRequest {
  id: number;
  amount: number;
  status: string;
  admin_notes: string;
  bank_card_number: string;
  card_holder_name: string;
  requested_at: string;
  created_at: string;
}

export default function Affiliates() {
  const [list, setList] = useState<AffiliateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
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
  const [editCommissionPercent, setEditCommissionPercent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Detail modal states
  const [customReferralLink, setCustomReferralLink] = useState('');
  const [detailCommissionPercent, setDetailCommissionPercent] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [salesListText, setSalesListText] = useState('');
  const [matchedBuyers, setMatchedBuyers] = useState<{ name: string; phone: string; registered_at: string }[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalNote, setWithdrawalNote] = useState<Record<number, string>>({});
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
        referral_link: a.referral_link || `https://asllmarket.com/affiliate/register?promoter=${a.id}`,
        balance: Number(a.balance) ?? 0,
        total_earnings: Number(a.total_earnings) ?? 0,
        commission_percent: Number(a.commission_percent) ?? 100,
        is_active: a.is_active ?? true,
        last_login: a.last_login ?? null,
        login_count: a.login_count ?? 0,
        created_at: a.created_at ?? '',
        needs_withdrawal_followup: a.needs_withdrawal_followup ?? false,
      })));
      setTotal(Number(data?.total ?? 0));
      const s = data?.stats;
      if (s) {
        setStats({
          active_count: Number(s.active_count) ?? 0,
          total_affiliate_income: Number(s.total_affiliate_income) ?? 0,
          total_leads: Number(s.total_leads) ?? 0,
        });
      }
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
    setEditCommissionPercent(row.commission_percent != null ? String(row.commission_percent) : '100');
    setEditOpen(true);
  };

  const openDelete = (row: AffiliateRow) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const openDetail = async (row: AffiliateRow) => {
    setSelected(row);
    // اگر لینک خالی است، به صورت خودکار تولید کن
    const defaultLink = row.referral_link || `https://asllmarket.com/affiliate/register?promoter=${row.id}`;
    setCustomReferralLink(defaultLink);
    setDetailCommissionPercent(row.commission_percent != null ? String(row.commission_percent) : '100');
    setCsvFile(null);
    setSalesListText('');
    setMatchedBuyers([]);
    setRegisteredUsers([]);
    setBuyers([]);
    setWithdrawalRequests([]);
    setWithdrawalNote({});
    setDetailOpen(true);
    loadRegisteredUsers(row.id);
    loadBuyers(row.id);
    loadWithdrawals(row.id);
  };

  const loadWithdrawals = async (id: number) => {
    setLoadingWithdrawals(true);
    try {
      const res = await adminApi.getAffiliateWithdrawalRequests(id, { page: 1, per_page: 100 });
      const data = res?.data ?? res;
      setWithdrawalRequests(data?.items ?? []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: 'بارگذاری درخواست‌های برداشت ناموفق بود' });
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const loadRegisteredUsers = async (id: number) => {
    setLoadingRegistered(true);
    try {
      const res = await adminApi.getAffiliateRegisteredUsers(id, { page: 1, per_page: 10000 });
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
      const res = await adminApi.getAffiliateBuyers(id, { page: 1, per_page: 10000 });
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
      const res = await adminApi.createAffiliate({ name: addName.trim(), username: addUsername.trim(), password: addPassword });
      const data = res?.data ?? res;
      const newAffiliateId = data?.id;
      toast({ title: 'افزوده شد', description: 'افیلیت با موفقیت ایجاد شد' });
      setAddOpen(false);
      setAddName('');
      setAddUsername('');
      setAddPassword('');
      await load();
      // اگر افیلیت ایجاد شد، modal detail را باز کن و لینک را نمایش بده
      if (newAffiliateId) {
        // از داده‌های برگشتی از API استفاده کن
        const affiliateData: AffiliateRow = {
          id: newAffiliateId,
          name: addName.trim(),
          username: addUsername.trim(),
          referral_code: data?.referral_code || '',
          referral_link: data?.referral_link || `https://asllmarket.com/affiliate/register?promoter=${newAffiliateId}`,
          balance: 0,
          total_earnings: 0,
          commission_percent: 100,
          is_active: true,
          last_login: null,
          login_count: 0,
          created_at: data?.created_at || new Date().toISOString(),
        };
        openDetail(affiliateData);
      }
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
      const pct = parseFloat(editCommissionPercent);
      if (!isNaN(pct) && pct >= 0 && pct <= 100) payload.commission_percent = pct;
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

  const handleSaveReferralLink = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.updateAffiliate(selected.id, { referral_link: customReferralLink.trim() });
      toast({ title: 'ذخیره شد', description: 'لینک اختصاصی با موفقیت به‌روزرسانی شد' });
      load();
      if (selected) {
        const updated = list.find(a => a.id === selected.id);
        if (updated) {
          setSelected({ ...updated, referral_link: customReferralLink.trim() });
        }
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'ذخیره لینک ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCommissionPercent = async () => {
    if (!selected) return;
    const pct = parseFloat(detailCommissionPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ variant: 'destructive', title: 'خطا', description: 'درصد باید بین ۰ تا ۱۰۰ باشد' });
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.updateAffiliate(selected.id, { commission_percent: pct });
      toast({ title: 'ذخیره شد', description: 'درصد سهم افیلیت به‌روزرسانی شد' });
      load();
      setSelected(prev => prev ? { ...prev, commission_percent: pct } : null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'ذخیره درصد ناموفق بود' });
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

  const handleWithdrawalStatus = async (reqId: number, status: 'completed' | 'rejected') => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const note = withdrawalNote[reqId] ?? '';
      await adminApi.updateAffiliateWithdrawalStatus(selected.id, reqId, status, note);
      toast({ title: status === 'completed' ? 'پرداخت شد' : 'رد شد', description: 'وضعیت به‌روزرسانی شد' });
      setWithdrawalNote((prev) => { const p = { ...prev }; delete p[reqId]; return p; });
      loadWithdrawals(selected.id);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'خطا', description: e?.message ?? 'به‌روزرسانی ناموفق بود' });
    } finally {
      setSubmitting(false);
    }
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

        {stats != null && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تعداد افیلیت‌های فعال</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.active_count.toLocaleString('fa-IR')}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">میزان درآمد افیلیت‌ها</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{Math.round(stats.total_affiliate_income).toLocaleString('fa-IR')} <span className="text-sm font-normal text-muted-foreground">تومان</span></p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">میزان لید گرفته از افیلیت‌ها</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.total_leads.toLocaleString('fa-IR')}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                        <th className="text-right py-3 px-2">درخواست برداشت وجه</th>
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
                            {row.referral_link ? (
                              <>
                                <code className="bg-muted px-1 rounded text-xs">{row.referral_link.substring(0, 30)}...</code>
                                <Button variant="ghost" size="icon" className="h-8 w-8 inline-flex mr-1" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.referral_link); toast({ title: 'کپی شد', description: 'لینک کپی شد' }); }}>
                                  {copiedCode === row.referral_link ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 px-2">{row.balance.toLocaleString('fa-IR')}</td>
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.needs_withdrawal_followup ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 'bg-green-500/20 text-green-700 dark:text-green-400'}`}>
                              {row.needs_withdrawal_followup ? 'نیاز به پیگیری' : 'پیگیری شده'}
                            </span>
                          </td>
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="link"><Link2 className="w-4 h-4 ml-1" /> لینک اختصاصی</TabsTrigger>
                <TabsTrigger value="registered"><Users className="w-4 h-4 ml-1" /> لیست ثبت‌نام‌ها</TabsTrigger>
                <TabsTrigger value="sales"><ShoppingCart className="w-4 h-4 ml-1" /> لیست فروش</TabsTrigger>
                <TabsTrigger value="buyers"><FileText className="w-4 h-4 ml-1" /> لیست خریداران</TabsTrigger>
                <TabsTrigger value="discount"><Percent className="w-4 h-4 ml-1" /> درصد افیلیت</TabsTrigger>
                <TabsTrigger value="withdrawals"><Banknote className="w-4 h-4 ml-1" /> درخواست برداشت</TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>لینک اختصاصی افیلیت</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customReferralLink || ''}
                      onChange={(e) => setCustomReferralLink(e.target.value)}
                      placeholder="https://asllmarket.com/signup?ref=..."
                      className="flex-1 font-mono text-sm dir-ltr"
                      dir="ltr"
                    />
                    {customReferralLink && (
                      <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(customReferralLink);
                        toast({ title: 'کپی شد', description: 'لینک کپی شد' });
                      }}>
                        <Copy className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">لینک کامل را وارد کنید. این لینک در پنل افیلیت نمایش داده می‌شود</p>
                </div>
                <Button onClick={handleSaveReferralLink} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  ذخیره لینک اختصاصی
                </Button>
              </TabsContent>

              <TabsContent value="registered" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>آپلود فایل CSV یا Excel لیست ثبت‌نام‌ها</Label>
                  <p className="text-xs text-muted-foreground">فرمت: نام (ستون 1)، شماره موبایل (ستون 2)، تاریخ ثبت‌نام (ستون 5)</p>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
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

              <TabsContent value="discount" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>درصد سهم افیلیت (۰–۱۰۰)</Label>
                  <p className="text-xs text-muted-foreground">این درصد روی کادر «درآمد شما» در داشبورد پنل افیلیت اعمال می‌شود. مثلاً اگر درآمد کل ۱۰ میلیون تومان و درصد ۱۰ باشد، درآمد شما افیلیت می‌شود ۱ میلیون تومان.</p>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={detailCommissionPercent}
                      onChange={(e) => setDetailCommissionPercent(e.target.value)}
                      placeholder="100"
                      className="w-28 font-mono"
                      dir="ltr"
                    />
                    <span className="text-muted-foreground">درصد</span>
                  </div>
                </div>
                <Button onClick={handleSaveCommissionPercent} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  ذخیره درصد سهم
                </Button>
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                  <h4 className="font-semibold mb-2">درخواست‌های برداشت ({withdrawalRequests.length})</h4>
                  {loadingWithdrawals ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : withdrawalRequests.length === 0 ? (
                    <p className="text-muted-foreground text-sm">درخواستی ثبت نشده است</p>
                  ) : (
                    withdrawalRequests.map((r) => (
                      <div key={r.id} className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold">{Number(r.amount).toLocaleString('fa-IR')} تومان</span>
                            <span className="text-muted-foreground text-sm mr-2"> — {r.card_holder_name || '—'}</span>
                          </div>
                          <span className={`text-sm px-2 py-0.5 rounded ${r.status === 'completed' ? 'bg-green-500/20 text-green-700' : r.status === 'rejected' ? 'bg-red-500/20 text-red-700' : 'bg-muted-foreground/20'}`}>
                            {r.status === 'completed' ? 'پرداخت شد' : r.status === 'rejected' ? 'رد شد' : 'در انتظار'}
                          </span>
                        </div>
                        {r.admin_notes && <p className="text-xs text-muted-foreground">توضیح ادمین: {r.admin_notes}</p>}
                        <p className="text-xs text-muted-foreground">تاریخ: {r.requested_at ? new Date(r.requested_at).toLocaleDateString('fa-IR') : '—'}</p>
                        {(r.status === 'pending' || r.status === 'approved' || r.status === 'processing') && (
                          <div className="flex gap-2 items-end pt-2">
                            <Textarea
                              placeholder="توضیح ادمین (اختیاری)"
                              value={withdrawalNote[r.id] ?? ''}
                              onChange={(e) => setWithdrawalNote((p) => ({ ...p, [r.id]: e.target.value }))}
                              className="flex-1 min-h-[60px] text-sm"
                              rows={2}
                            />
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" onClick={() => handleWithdrawalStatus(r.id, 'completed')} disabled={submitting}>
                                پرداخت شد
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleWithdrawalStatus(r.id, 'rejected')} disabled={submitting}>
                                رد شد
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
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
              <div className="space-y-2">
                <Label>درصد سهم افیلیت (۰–۱۰۰)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={editCommissionPercent} onChange={(e) => setEditCommissionPercent(e.target.value)} placeholder="100" dir="ltr" />
                <p className="text-xs text-muted-foreground">اعمال روی درآمد شما در پنل افیلیت (مثلاً ۱۰ یعنی ۱۰٪ از درآمد کل)</p>
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
