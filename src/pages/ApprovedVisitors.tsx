import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Users, 
  Phone,
  Mail,
  MapPin, 
  CreditCard,
  Briefcase,
  Languages, 
  Calendar,
  FileText,
  AlertCircle,
  Edit,
  MoreVertical
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface VisitorData {
  id: number;
  user_id: number;
  full_name: string;
  national_id: string;
  passport_number: string;
  birth_date: string;
  mobile: string;
  whatsapp_number: string;
  email: string;
  residence_address: string;
  city_province: string;
  destination_cities: string;
  has_local_contact: boolean;
  local_contact_details: string;
  bank_account_iban: string;
  bank_name: string;
  account_holder_name: string;
  has_marketing_experience: boolean;
  marketing_experience_desc: string;
  language_level: string;
  special_skills: string;
  interested_products: string;
  agrees_to_use_approved_products: boolean;
  agrees_to_violation_consequences: boolean;
  agrees_to_submit_reports: boolean;
  digital_signature: string;
  signature_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  approved_at: string | null;
  is_featured: boolean;
  featured_at: string | null;
  created_at: string;
}

interface VisitorsResponse {
  visitors: VisitorData[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />تایید شده</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />رد شده</Badge>;
    case 'pending':
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />در انتظار</Badge>;
  }
};

const getLanguageLevelLabel = (level: string) => {
  switch (level) {
    case 'excellent': return 'عالی';
    case 'good': return 'متوسط';
    case 'weak': return 'ضعیف';
    case 'none': return 'بلد نیستم';
    default: return level;
  }
};

export default function ApprovedVisitors() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'update'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVisitors = async (page = 1, status = 'all', search = '') => {
    setLoading(true);
    try {
      const response = await apiService.getVisitorsForAdmin({
        page,
        per_page: 10,
        status,
        search
      });
      const data: VisitorsResponse = response.data;
      
      setVisitors(data.visitors);
      setCurrentPage(data.page);
      setTotalPages(data.total_pages);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: "خطا در دریافت لیست ویزیتورها",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors(currentPage, statusFilter, searchTerm);
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVisitors(1, statusFilter, searchTerm);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleViewDetails = (visitor: VisitorData) => {
    setSelectedVisitor(visitor);
    setShowDetailsDialog(true);
  };

  const handleAction = (visitor: VisitorData, action: 'approve' | 'reject' | 'update') => {
    setSelectedVisitor(visitor);
    setActionType(action);
    setAdminNotes(visitor.admin_notes || '');
    setNewStatus(visitor.status);
    setShowActionDialog(true);
  };

  const executeAction = async () => {
    if (!selectedVisitor) return;

    setActionLoading(selectedVisitor.id);
    try {
      if (actionType === 'approve') {
        await apiService.approveVisitor(selectedVisitor.id, { admin_notes: adminNotes });
        toast({
          title: "تایید شد",
          description: "ویزیتور با موفقیت تایید شد",
        });
      } else if (actionType === 'reject') {
        if (!adminNotes.trim()) {
          toast({
            title: "خطا",
            description: "لطفا دلیل رد درخواست را وارد کنید",
            variant: "destructive",
          });
          return;
        }
        await apiService.rejectVisitor(selectedVisitor.id, { admin_notes: adminNotes });
        toast({
          title: "رد شد",
          description: "درخواست ویزیتور رد شد",
        });
      } else if (actionType === 'update') {
        await apiService.updateVisitorStatus(selectedVisitor.id, { 
          status: newStatus as any, 
          admin_notes: adminNotes 
        });
        toast({
          title: "به‌روزرسانی شد",
          description: "وضعیت ویزیتور به‌روزرسانی شد",
        });
      }

      setShowActionDialog(false);
      setAdminNotes('');
      fetchVisitors(currentPage, statusFilter, searchTerm);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.response?.data?.error || "خطا در انجام عملیات",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            مدیریت ویزیتورها
          </CardTitle>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">جستجو</Label>
              <div className="flex gap-2">
                  <Input
                  id="search"
                  placeholder="جستجو بر اساس نام، موبایل، کد ملی..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                <Button onClick={handleSearch} variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              </div>
              
            <div className="w-full md:w-48">
              <Label>فیلتر وضعیت</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger>
                  <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="approved">تایید شده</SelectItem>
                  <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Visitors Table */}
        <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : visitors.length === 0 ? (
              <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ویزیتوری یافت نشد</h3>
              <p className="text-muted-foreground">
                با فیلترهای انتخاب شده هیچ ویزیتوری یافت نشد.
              </p>
              </div>
            ) : (
              <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>موبایل</TableHead>
                    <TableHead>شهر/استان</TableHead>
                    <TableHead>مقصد</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ ثبت‌نام</TableHead>
                    <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {visitors.map((visitor) => (
                        <TableRow key={visitor.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {visitor.is_featured === true && visitor.hasOwnProperty('is_featured') && (
                                <span className="text-yellow-500">⭐</span>
                              )}
                              {visitor.full_name}
                            </div>
                          </TableCell>
                      <TableCell>{visitor.mobile}</TableCell>
                      <TableCell>{visitor.city_province}</TableCell>
                      <TableCell className="max-w-32 truncate">
                        {visitor.destination_cities}
                          </TableCell>
                      <TableCell>{getStatusBadge(visitor.status)}</TableCell>
                          <TableCell>
                        {new Date(visitor.created_at).toLocaleDateString('fa-IR')}
                          </TableCell>
                          <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(visitor)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            مشاهده
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={actionLoading === visitor.id}
                              >
                                {actionLoading === visitor.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-3 w-3" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {visitor.status === 'pending' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleAction(visitor, 'approve')}
                                    className="text-green-600"
                                  >
                                    <ThumbsUp className="h-3 w-3 mr-2" />
                                    تایید
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleAction(visitor, 'reject')}
                                    className="text-red-600"
                                  >
                                    <ThumbsDown className="h-3 w-3 mr-2" />
                                    رد
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => handleAction(visitor, 'update')}>
                                <Edit className="h-3 w-3 mr-2" />
                                ویرایش وضعیت
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        قبلی
                      </Button>
                      
                  <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                              <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                          onClick={() => setCurrentPage(page)}
                              >
                          {page}
                              </Button>
                            );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        بعدی
                      </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات ویزیتور</DialogTitle>
          </DialogHeader>
          
          {selectedVisitor && (
            <div className="space-y-6">
              {/* Status and Notes */}
              <div className="flex justify-between items-start">
                {getStatusBadge(selectedVisitor.status)}
                {selectedVisitor.admin_notes && (
                  <Alert className="flex-1 ml-4">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>یادداشت مدیر:</strong><br />
                      {selectedVisitor.admin_notes}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      اطلاعات شناسایی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><strong>نام:</strong> {selectedVisitor.full_name}</div>
                    <div><strong>کد ملی:</strong> {selectedVisitor.national_id}</div>
                    {selectedVisitor.passport_number && (
                      <div><strong>پاسپورت:</strong> {selectedVisitor.passport_number}</div>
                    )}
                    <div><strong>تاریخ تولد:</strong> {selectedVisitor.birth_date}</div>
                    <div><strong>موبایل:</strong> {selectedVisitor.mobile}</div>
                    {selectedVisitor.whatsapp_number && (
                      <div><strong>واتساپ:</strong> {selectedVisitor.whatsapp_number}</div>
                    )}
                    {selectedVisitor.email && (
                      <div><strong>ایمیل:</strong> {selectedVisitor.email}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Travel Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      سکونت و سفر
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><strong>آدرس:</strong> {selectedVisitor.residence_address}</div>
                    <div><strong>شهر/استان:</strong> {selectedVisitor.city_province}</div>
                    <div><strong>مقصد:</strong> {selectedVisitor.destination_cities}</div>
                    <div><strong>آشنای محلی:</strong> {selectedVisitor.has_local_contact ? 'بله' : 'خیر'}</div>
                    {selectedVisitor.has_local_contact && selectedVisitor.local_contact_details && (
                      <div><strong>جزئیات:</strong> {selectedVisitor.local_contact_details}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Banking Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      اطلاعات بانکی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><strong>شماره حساب:</strong> <span className="font-mono">{selectedVisitor.bank_account_iban}</span></div>
                    <div><strong>نام بانک:</strong> {selectedVisitor.bank_name}</div>
                    {selectedVisitor.account_holder_name && (
                      <div><strong>صاحب حساب:</strong> {selectedVisitor.account_holder_name}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills and Experience */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      تجربه و مهارت
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><strong>تجربه بازاریابی:</strong> {selectedVisitor.has_marketing_experience ? 'بله' : 'خیر'}</div>
                    {selectedVisitor.has_marketing_experience && selectedVisitor.marketing_experience_desc && (
                      <div><strong>توضیح:</strong> {selectedVisitor.marketing_experience_desc}</div>
                    )}
                    <div><strong>سطح زبان:</strong> {getLanguageLevelLabel(selectedVisitor.language_level)}</div>
                    {selectedVisitor.special_skills && (
                      <div><strong>مهارت‌ها:</strong> {selectedVisitor.special_skills}</div>
                    )}
                    {selectedVisitor.interested_products && (
                      <div className="mt-2">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-500">⭐</span>
                          <div>
                            <strong>محصولات مورد علاقه:</strong>
                            <p className="text-sm text-muted-foreground mt-1">{selectedVisitor.interested_products}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Digital Signature */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    امضا و تاریخ
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><strong>امضا:</strong> {selectedVisitor.digital_signature}</div>
                  <div><strong>تاریخ امضا:</strong> {selectedVisitor.signature_date}</div>
                  <div><strong>تاریخ ثبت‌نام:</strong> {new Date(selectedVisitor.created_at).toLocaleDateString('fa-IR')}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'تایید ویزیتور'}
              {actionType === 'reject' && 'رد درخواست ویزیتور'}
              {actionType === 'update' && 'ویرایش وضعیت ویزیتور'}
            </DialogTitle>
            <DialogDescription>
              {selectedVisitor?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'update' && (
              <div className="space-y-2">
                <Label>وضعیت جدید</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">در انتظار بررسی</SelectItem>
                    <SelectItem value="approved">تایید شده</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin_notes">
                {actionType === 'reject' ? 'دلیل رد درخواست (الزامی)' : 'یادداشت مدیر (اختیاری)'}
              </Label>
              <Textarea
                id="admin_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === 'reject' 
                    ? 'لطفا دلیل رد درخواست را شرح دهید...'
                    : 'یادداشت یا توضیحات اضافی...'
                }
                rows={4}
              />
            </div>
      </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              انصراف
            </Button>
            <Button
              onClick={executeAction}
              disabled={actionLoading !== null}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {actionLoading !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionType === 'approve' && 'تایید'}
              {actionType === 'reject' && 'رد درخواست'}
              {actionType === 'update' && 'به‌روزرسانی'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}