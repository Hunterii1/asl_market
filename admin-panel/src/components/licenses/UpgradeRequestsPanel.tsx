import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { adminApi, type UpgradeRequestApi } from '@/lib/api/adminApi';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, User, ArrowUpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type DialogMode = 'approve' | 'reject' | null;

interface UpgradeRequestsPanelProps {
  onPendingCountChange?: (count: number) => void;
}

export function UpgradeRequestsPanel({ onPendingCountChange }: UpgradeRequestsPanelProps) {
  const [requests, setRequests] = useState<UpgradeRequestApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<UpgradeRequestApi | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPendingUpgradeRequests();
      const list = res?.requests ?? [];
      setRequests(list);
      onPendingCountChange?.(list.length);
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'خطا',
        description: e?.message || 'بارگذاری درخواست‌های ارتقا ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const openDialog = (mode: 'approve' | 'reject', req: UpgradeRequestApi) => {
    setDialogMode(mode);
    setSelected(req);
    setAdminNote('');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelected(null);
    setAdminNote('');
  };

  const handleSubmit = async () => {
    if (!selected || !dialogMode) return;
    if (dialogMode === 'reject' && !adminNote.trim()) {
      toast({
        title: 'توجه',
        description: 'برای رد درخواست، توضیح برای کاربر الزامی است.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSubmitting(true);
      if (dialogMode === 'approve') {
        await adminApi.approveUpgradeRequest(selected.id, {
          admin_note: adminNote.trim() || undefined,
        });
        toast({
          title: 'تایید شد',
          description: 'لایسنس کاربر به پرو ارتقا یافت.',
        });
      } else {
        await adminApi.rejectUpgradeRequest(selected.id, {
          admin_note: adminNote.trim(),
        });
        toast({
          title: 'رد شد',
          description: 'درخواست ارتقا رد و به کاربر اطلاع داده می‌شود.',
        });
      }
      closeDialog();
      await load();
    } catch (e: any) {
      toast({
        title: 'خطا',
        description: e?.message || 'عملیات ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const planLabel = (p: string) => {
    const x = (p || '').toLowerCase();
    if (x === 'plus' || x === 'پلاس') return 'پلاس';
    if (x === 'pro' || x === 'پرو') return 'پرو';
    return p || '—';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-primary" />
                درخواست‌های ارتقای لایسنس
              </CardTitle>
              <CardDescription className="mt-1">
                کاربرانی که پلان پلاس دارند و در اپ درخواست ارتقا به پرو ثبت کرده‌اند (قبلاً از طریق
                تلگرام؛ اکنون از همین لیست مدیریت می‌شود).
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بروزرسانی'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-14 px-4 text-muted-foreground">
              <p>درخواست ارتقای در انتظاری وجود ندارد.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-3 text-right font-medium">کاربر</th>
                    <th className="p-3 text-right font-medium">ارتقا</th>
                    <th className="p-3 text-right font-medium min-w-[200px]">یادداشت کاربر</th>
                    <th className="p-3 text-right font-medium whitespace-nowrap">تاریخ</th>
                    <th className="p-3 text-right font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const u = req.user;
                    const name = u
                      ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—'
                      : `کاربر #${req.user_id}`;
                    return (
                      <tr key={req.id} className="border-b border-border/60 hover:bg-muted/20">
                        <td className="p-3 align-top">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium">{name}</p>
                              {u?.phone && (
                                <p className="text-xs text-muted-foreground dir-ltr text-right">
                                  {u.phone}
                                </p>
                              )}
                              {u?.email && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {u.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="secondary">{planLabel(req.from_plan)}</Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge className="bg-primary/15 text-primary border-primary/30">
                              {planLabel(req.to_plan)}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 align-top text-muted-foreground max-w-md">
                          {req.request_note?.trim() ? (
                            <span className="whitespace-pre-wrap break-words">{req.request_note}</span>
                          ) : (
                            <span className="italic opacity-70">—</span>
                          )}
                        </td>
                        <td className="p-3 align-top whitespace-nowrap text-muted-foreground">
                          {req.created_at
                            ? new Date(req.created_at).toLocaleString('fa-IR')
                            : '—'}
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => openDialog('approve', req)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => openDialog('reject', req)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              رد
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== null} onOpenChange={(o) => !o && !submitting && closeDialog()}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'approve' ? 'تایید ارتقا به پرو' : 'رد درخواست ارتقا'}
            </DialogTitle>
            <DialogDescription>
              {selected && (
                <>
                  کاربر:{' '}
                  <strong>
                    {selected.user
                      ? `${selected.user.first_name} ${selected.user.last_name}`
                      : `#${selected.user_id}`}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="admin-note">
              {dialogMode === 'reject'
                ? 'توضیح برای کاربر (الزامی)'
                : 'یادداشت ادمین (اختیاری)'}
            </Label>
            <Textarea
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                dialogMode === 'reject'
                  ? 'دلیل رد را بنویسید...'
                  : 'مثلاً تأیید پرداخت یا یادداشت داخلی...'
              }
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              انصراف
            </Button>
            <Button
              variant={dialogMode === 'reject' ? 'destructive' : 'default'}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              {dialogMode === 'approve' ? 'تایید و ارتقای لایسنس' : 'رد درخواست'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
