import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
import HeaderAuth from "@/components/ui/HeaderAuth";
import {
  Package,
  Calendar,
  Globe2,
  DollarSign,
  Users,
  User,
  Clock,
  Send,
  AlertCircle,
  MapPin,
  CheckCircle,
  Building,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VisitorProject {
  id: number;
  visitor_id: number;
  user_id: number;
  visitor: {
    id: number;
    user_id: number;
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
  remaining_time: string;
  is_expired: boolean;
  created_at: string;
}

const toFarsiNumber = (num: number | string) => {
  if (typeof num === "string") {
    return num.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  return num.toLocaleString("fa-IR");
};

export default function SupplierVisitorProjects() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<VisitorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<VisitorProject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [proposalData, setProposalData] = useState({
    proposal_type: "interested" as "interested" | "question",
    message: "",
    offered_price: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  // Debug: Check if user_id exists
  useEffect(() => {
    if (projects.length > 0) {
      console.log("Sample project visitor:", projects[0]?.visitor);
      console.log("Has user_id:", !!projects[0]?.visitor?.user_id);
    }
  }, [projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAvailableVisitorProjects({
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

  const handleOpenProposalDialog = (project: VisitorProject) => {
    setSelectedProject(project);
    setProposalData({
      proposal_type: "interested",
      message: "",
      offered_price: "",
    });
    setProposalDialogOpen(true);
  };

  const handleSubmitProposal = async () => {
    if (!selectedProject) return;

    if (!proposalData.message && proposalData.proposal_type === "question") {
      toast({
        title: "خطا",
        description: "لطفاً پیام خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await apiService.submitVisitorProjectProposal(selectedProject.id, proposalData);

      toast({
        title: "موفق",
        description: "پیشنهاد شما با موفقیت ارسال شد. ویزیتور به زودی مطلع خواهد شد.",
      });

      setProposalDialogOpen(false);
      loadProjects();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در ارسال پیشنهاد",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
              برای مشاهده پروژه‌های ویزیتوری و ارسال پیشنهاد، لطفاً وارد شوید.
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            پروژه‌های ویزیتوری فعال
          </h1>
          <p className="text-sm text-muted-foreground">
            پروژه‌های ویزیتوری که منتظر پیشنهاد شما هستند
          </p>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-card/50 border-border rounded-3xl">
            <CardContent className="py-20 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">در حال حاضر پروژه‌ای در دسترس نیست</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/50 rounded-3xl hover:border-purple-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                        {project.project_title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        {project.product_name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      فعال
                    </Badge>
                  </div>

                  {/* Visitor Info */}
                  <div className="p-3 bg-slate-900/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => {
                            const userId = project.visitor?.user_id;
                            if (userId) {
                              navigate(`/profile/${userId}`);
                            } else {
                              toast({
                                title: "خطا",
                                description: "شناسه کاربر یافت نشد",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm font-semibold text-foreground line-clamp-1 hover:text-purple-400 transition-colors text-right w-full"
                        >
                          {project.visitor.full_name}
                        </button>
                        {(project.visitor.city_province || project.visitor.destination_cities) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
                            <MapPin className="w-3 h-3" />
                            {project.visitor.city_province || project.visitor.destination_cities}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const userId = project.visitor?.user_id;
                        if (userId) {
                          navigate(`/profile/${userId}`);
                        } else {
                          toast({
                            title: "خطا",
                            description: "شناسه کاربر یافت نشد. لطفاً صفحه را رفرش کنید.",
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all text-xs"
                    >
                      <User className="w-3 h-3 mr-1" />
                      مشاهده پروفایل ویزیتور
                    </Button>
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

                  {project.delivery_time && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-slate-900/40 rounded-xl">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span className="text-muted-foreground text-xs">
                        زمان تحویل: {project.delivery_time}
                      </span>
                    </div>
                  )}

                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 p-3 bg-slate-900/40 rounded-xl">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 p-3 bg-orange-500/10 rounded-xl border border-orange-500/30">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-orange-200 font-semibold">
                        {project.remaining_time}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenProposalDialog(project)}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    ارسال پیشنهاد
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Proposal Dialog */}
      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-purple-500/30 rounded-3xl" dir="rtl">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  ارسال پیشنهاد برای پروژه
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectedProject.project_title} - {selectedProject.product_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Project Summary */}
                <Card className="bg-slate-900/60 border-slate-700/60 rounded-2xl">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">مقدار:</span>
                      <span className="font-semibold text-foreground">
                        {toFarsiNumber(selectedProject.quantity)} {selectedProject.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">کشورهای مقصد:</span>
                      <span className="font-semibold text-foreground">{selectedProject.target_countries}</span>
                    </div>
                    {selectedProject.budget && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">بودجه:</span>
                        <span className="font-semibold text-foreground">
                          {toFarsiNumber(selectedProject.budget)} {selectedProject.currency}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Proposal Type */}
                <div className="space-y-2">
                  <Label htmlFor="proposal_type">نوع پیشنهاد *</Label>
                  <Select
                    value={proposalData.proposal_type}
                    onValueChange={(value: "interested" | "question") =>
                      setProposalData({ ...proposalData, proposal_type: value })
                    }
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interested">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>علاقه‌مند به همکاری</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="question">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-sky-400" />
                          <span>سوال دارم</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    پیام {proposalData.proposal_type === "question" ? "*" : "(اختیاری)"}
                  </Label>
                  <Textarea
                    id="message"
                    value={proposalData.message}
                    onChange={(e) => setProposalData({ ...proposalData, message: e.target.value })}
                    placeholder={
                      proposalData.proposal_type === "interested"
                        ? "توضیحات تکمیلی درباره پیشنهاد شما..."
                        : "سوال خود را بپرسید..."
                    }
                    rows={4}
                    className="rounded-2xl"
                  />
                </div>

                {/* Offered Price (only for interested) */}
                {proposalData.proposal_type === "interested" && (
                  <div className="space-y-2">
                    <Label htmlFor="offered_price">قیمت پیشنهادی (اختیاری)</Label>
                    <Input
                      id="offered_price"
                      value={proposalData.offered_price}
                      onChange={(e) => setProposalData({ ...proposalData, offered_price: e.target.value })}
                      placeholder="مثال: 45000 USD"
                      className="rounded-2xl"
                    />
                  </div>
                )}

                <Alert className="bg-purple-500/10 border-purple-500/30">
                  <AlertCircle className="h-4 w-4 text-purple-400" />
                  <AlertDescription className="text-purple-200 text-xs">
                    پیشنهاد شما به ویزیتور ارسال خواهد شد و او می‌تواند با شما تماس بگیرد.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitProposal}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "در حال ارسال..." : "ارسال پیشنهاد"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProposalDialogOpen(false)}
                  className="rounded-2xl"
                >
                  انصراف
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
