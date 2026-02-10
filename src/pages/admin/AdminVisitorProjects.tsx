import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package,
  Eye,
  Search,
  Filter,
  TrendingUp,
  CheckCircle,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API_BASE_URL = "/api/v1";

const toFarsiNumber = (num: number | string) => {
  if (typeof num === "string") {
    return num.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  return num.toLocaleString("fa-IR");
};

interface VisitorProject {
  id: number;
  visitor: {
    id: number;
    full_name: string;
  };
  project_title: string;
  product_name: string;
  quantity: string;
  unit: string;
  target_countries: string;
  budget?: string;
  currency: string;
  status: string;
  matched_supplier_count: number;
  proposals_count: number;
  remaining_time: string;
  is_expired: boolean;
  created_at: string;
}

interface Stats {
  total_projects: number;
  active_projects: number;
  accepted_projects: number;
  expired_projects: number;
  completed_projects: number;
  total_proposals: number;
  total_chats: number;
}

export default function AdminVisitorProjects() {
  const [projects, setProjects] = useState<VisitorProject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadStats();
    loadProjects();
  }, [statusFilter, page]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/visitor-projects/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      console.error("خطا در بارگذاری آمار:", error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/admin/visitor-projects?status=${statusFilter}&page=${page}&per_page=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setProjects(data.data || []);
      setTotalPages(data.total_pages || 1);
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

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-slate-500/20 text-slate-300 border-slate-500/40">
          منقضی شده
        </Badge>
      );
    }
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            فعال
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/40">
            پذیرفته شده
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/40">
            مختوم شده
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/40">
            لغو شده
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredProjects = projects.filter(
    (proj) =>
      proj.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.visitor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">مدیریت پروژه‌های ویزیتوری</h1>
        <p className="text-muted-foreground">مشاهده و مدیریت تمام پروژه‌های ویزیتوری</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کل پروژه‌ها</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.total_projects)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">فعال</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.active_projects)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مختوم شده</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.completed_projects)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کل پیشنهادها</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.total_proposals)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در عنوان، محصول، ویزیتور..."
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="accepted">پذیرفته شده</SelectItem>
                <SelectItem value="completed">مختوم شده</SelectItem>
                <SelectItem value="expired">منقضی شده</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">پروژه‌ای یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.project_title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      ویزیتور: {project.visitor?.full_name} | محصول: {project.product_name}
                    </p>
                  </div>
                  {getStatusBadge(project.status, project.is_expired)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">مقدار</p>
                    <p className="text-sm font-semibold">
                      {toFarsiNumber(project.quantity)} {project.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">کشورهای مقصد</p>
                    <p className="text-sm font-semibold">{project.target_countries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">تعداد پیشنهادها</p>
                    <p className="text-sm font-semibold">{toFarsiNumber(project.proposals_count)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">زمان باقیمانده</p>
                    <p className="text-sm font-semibold">{project.remaining_time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    مشاهده جزئیات
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحه {toFarsiNumber(page)} از {toFarsiNumber(totalPages)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}
