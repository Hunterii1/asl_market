import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import HeaderAuth from "@/components/ui/HeaderAuth";
import {
  Package,
  Plus,
  Calendar,
  Globe2,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Building,
  MapPin,
  Star,
  MessageCircle,
  CheckSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VisitorProject {
  id: number;
  visitor_id: number;
  user_id: number;
  visitor: {
    id: number;
    full_name: string;
    city_province: string;
    destination_cities: string;
  };
  project_title: string;
  product_name: string;
  quantity: string;
  unit: string;
  target_countries: string;
  budget?: string;
  currency: string;
  payment_terms?: string;
  delivery_time?: string;
  description?: string;
  expires_at: string;
  status: string;
  matched_supplier_count: number;
  accepted_supplier_id?: number;
  accepted_at?: string;
  remaining_time: string;
  is_expired: boolean;
  proposals?: Proposal[];
  created_at: string;
  updated_at: string;
}

interface Proposal {
  id: number;
  visitor_project_id: number;
  supplier_id: number;
  supplier: {
    id: number;
    full_name: string;
    brand_name: string;
    city: string;
    is_featured: boolean;
    average_rating: number;
    total_ratings: number;
  };
  proposal_type: string;
  message?: string;
  offered_price?: string;
  status: string;
  created_at: string;
}

const toFarsiNumber = (num: number | string) => {
  if (typeof num === "string") {
    return num.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  return num.toLocaleString("fa-IR");
};

export default function VisitorProjects() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<VisitorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<VisitorProject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    project_title: "",
    product_name: "",
    quantity: "",
    unit: "kg",
    target_countries: "",
    budget: "",
    currency: "USD",
    payment_terms: "",
    delivery_time: "",
    description: "",
    expires_at: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyVisitorProjects({
        status: statusFilter,
        page: 1,
        per_page: 50,
      });
      setProjects(response.data || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در بارگذاری پروژه‌ها",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.project_title || !formData.product_name || !formData.quantity || !formData.target_countries || !formData.expires_at) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const expiresAt = new Date(formData.expires_at).toISOString();
      
      await apiService.createVisitorProject({
        ...formData,
        expires_at: expiresAt,
      });

      toast({
        title: "موفق",
        description: "پروژه ویزیتوری با موفقیت ثبت شد. تأمین‌کننده‌های مناسب به زودی مطلع خواهند شد.",
      });

      setCreateDialogOpen(false);
      setFormData({
        project_title: "",
        product_name: "",
        quantity: "",
        unit: "kg",
        target_countries: "",
        budget: "",
        currency: "USD",
        payment_terms: "",
        delivery_time: "",
        description: "",
        expires_at: "",
      });
      loadProjects();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در ثبت پروژه",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (project: VisitorProject) => {
    try {
      const response = await apiService.getVisitorProjectDetails(project.id);
      setSelectedProject(response.project);
      setDetailsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در بارگذاری جزئیات",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این پروژه را حذف کنید؟")) return;

    try {
      await apiService.deleteVisitorProject(id);
      toast({
        title: "موفق",
        description: "پروژه با موفقیت حذف شد",
      });
      loadProjects();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف پروژه",
        variant: "destructive",
      });
    }
  };

  const handleCloseProject = async (id: number) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این پروژه را مختوم کنید؟")) return;

    try {
      await apiService.closeVisitorProject(id);
      toast({
        title: "موفق",
        description: "پروژه با موفقیت مختوم شد",
      });
      loadProjects();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در بستن پروژه",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return <Badge variant="outline" className="bg-slate-500/20 text-slate-300 border-slate-500/40">منقضی شده</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">فعال</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/40">پذیرفته شده</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/40">تکمیل شده</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/40">لغو شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <HeaderAuth />
        <div className="container mx-auto px-4 py-20">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              برای مشاهده و ثبت پروژه‌های ویزیتوری، لطفاً وارد شوید.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderAuth />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              پروژه‌های ویزیتوری من
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              پروژه‌های خود را ثبت کنید و تأمین‌کننده‌ها پیشنهاد بدهند
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/visitor-project-chats")}
              className="rounded-2xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              چت‌ها
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              ثبت پروژه جدید
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "active", "accepted", "completed", "cancelled"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-2xl",
                statusFilter === status && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              {status === "all" ? "همه" : status === "active" ? "فعال" : status === "accepted" ? "پذیرفته شده" : status === "completed" ? "تکمیل شده" : "لغو شده"}
            </Button>
          ))}
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-card/50 border-border rounded-3xl">
            <CardContent className="py-20 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">هنوز پروژه‌ای ثبت نشده است</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                اولین پروژه خود را ثبت کنید
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/50 rounded-3xl hover:border-orange-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                        {project.project_title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        {project.product_name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status, project.is_expired)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-orange-400" />
                      <span className="text-muted-foreground">
                        {toFarsiNumber(project.quantity)} {project.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe2 className="w-4 h-4 text-blue-400" />
                      <span className="text-muted-foreground line-clamp-1">
                        {project.target_countries}
                      </span>
                    </div>
                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-muted-foreground">
                          {toFarsiNumber(project.budget)} {project.currency}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-muted-foreground">
                        {toFarsiNumber(project.matched_supplier_count)} پیشنهاد
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-muted-foreground">
                      {project.remaining_time}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(project)}
                      className="flex-1 rounded-2xl"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      جزئیات
                    </Button>
                    {project.status === "active" && !project.is_expired && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCloseProject(project.id)}
                          className="rounded-2xl text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProject(project.id)}
                          className="rounded-2xl text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-orange-500/30 rounded-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">ثبت پروژه ویزیتوری جدید</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              پروژه خود را ثبت کنید تا تأمین‌کننده‌های مناسب پیشنهاد بدهند
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_title">عنوان پروژه *</Label>
                <Input
                  id="project_title"
                  value={formData.project_title}
                  onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                  placeholder="مثال: تأمین زعفران صادراتی"
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_name">نام محصول *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="مثال: زعفران سرگل"
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">مقدار *</Label>
                <Input
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="مثال: 500"
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">واحد *</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">کیلوگرم (kg)</SelectItem>
                    <SelectItem value="ton">تن (ton)</SelectItem>
                    <SelectItem value="package">بسته</SelectItem>
                    <SelectItem value="unit">عدد</SelectItem>
                    <SelectItem value="liter">لیتر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_countries">کشورهای مقصد *</Label>
              <Input
                id="target_countries"
                value={formData.target_countries}
                onChange={(e) => setFormData({ ...formData, target_countries: e.target.value })}
                placeholder="مثال: امارات، عمان، کویت"
                className="rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">بودجه (اختیاری)</Label>
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="مثال: 50000"
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">ارز *</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">دلار (USD)</SelectItem>
                    <SelectItem value="EUR">یورو (EUR)</SelectItem>
                    <SelectItem value="AED">درهم (AED)</SelectItem>
                    <SelectItem value="IRR">ریال (IRR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">شرایط پرداخت (اختیاری)</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="مثال: 30% پیش‌پرداخت"
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_time">زمان تحویل (اختیاری)</Label>
                <Input
                  id="delivery_time"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  placeholder="مثال: 30 روز"
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">تاریخ انقضا *</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات (اختیاری)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="جزئیات بیشتر درباره پروژه..."
                rows={4}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCreateProject}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl"
            >
              {submitting ? "در حال ثبت..." : "ثبت پروژه"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="rounded-2xl"
            >
              انصراف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-orange-500/30 rounded-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-bold text-foreground">
                      {selectedProject.project_title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                      {selectedProject.product_name}
                    </DialogDescription>
                  </div>
                  {getStatusBadge(selectedProject.status, selectedProject.is_expired)}
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Project Info */}
                <Card className="bg-slate-900/60 border-slate-700/60 rounded-2xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">مقدار</p>
                        <p className="text-sm font-semibold text-foreground">
                          {toFarsiNumber(selectedProject.quantity)} {selectedProject.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">کشورهای مقصد</p>
                        <p className="text-sm font-semibold text-foreground">{selectedProject.target_countries}</p>
                      </div>
                      {selectedProject.budget && (
                        <div>
                          <p className="text-xs text-muted-foreground">بودجه</p>
                          <p className="text-sm font-semibold text-foreground">
                            {toFarsiNumber(selectedProject.budget)} {selectedProject.currency}
                          </p>
                        </div>
                      )}
                      {selectedProject.delivery_time && (
                        <div>
                          <p className="text-xs text-muted-foreground">زمان تحویل</p>
                          <p className="text-sm font-semibold text-foreground">{selectedProject.delivery_time}</p>
                        </div>
                      )}
                    </div>
                    {selectedProject.payment_terms && (
                      <div>
                        <p className="text-xs text-muted-foreground">شرایط پرداخت</p>
                        <p className="text-sm font-semibold text-foreground">{selectedProject.payment_terms}</p>
                      </div>
                    )}
                    {selectedProject.description && (
                      <div>
                        <p className="text-xs text-muted-foreground">توضیحات</p>
                        <p className="text-sm text-foreground">{selectedProject.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">زمان باقیمانده</p>
                      <p className="text-sm font-semibold text-foreground">{selectedProject.remaining_time}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Proposals */}
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    پیشنهادهای تأمین‌کننده‌ها ({toFarsiNumber(selectedProject.proposals?.length || 0)})
                  </h3>
                  {selectedProject.proposals && selectedProject.proposals.length > 0 ? (
                    <div className="space-y-3">
                      {selectedProject.proposals.map((proposal) => (
                        <Card key={proposal.id} className="bg-slate-900/60 border-slate-700/60 rounded-2xl">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                  <Building className="w-5 h-5 text-orange-300" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {proposal.supplier.brand_name || proposal.supplier.full_name}
                                  </p>
                                  {proposal.supplier.city && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {proposal.supplier.city}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-semibold text-yellow-300">
                                  {toFarsiNumber(proposal.supplier.average_rating || 0)}
                                </span>
                              </div>
                            </div>
                            {proposal.proposal_type === "interested" && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 mb-2">
                                علاقه‌مند
                              </Badge>
                            )}
                            {proposal.message && (
                              <p className="text-sm text-muted-foreground mb-2">{proposal.message}</p>
                            )}
                            {proposal.offered_price && (
                              <p className="text-sm font-semibold text-emerald-300">
                                قیمت پیشنهادی: {toFarsiNumber(proposal.offered_price)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      هنوز پیشنهادی ثبت نشده است
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
