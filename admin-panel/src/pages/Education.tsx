import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  GraduationCap, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  GraduationCap as GraduationCapIcon,
  CheckCircle,
  Archive,
  FileEdit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye as EyeIcon,
  Heart,
  Clock,
  Video,
  FileText,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddEducationDialog } from '@/components/education/AddEducationDialog';
import { EditEducationDialog } from '@/components/education/EditEducationDialog';
import { ViewEducationDialog } from '@/components/education/ViewEducationDialog';
import { DeleteEducationDialog } from '@/components/education/DeleteEducationDialog';
import { EducationFilters } from '@/components/education/EducationFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Education {
  id: string;
  title: string;
  description: string;
  category: 'video' | 'article' | 'course' | 'tutorial' | 'documentation' | 'other';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  content?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  isFree: boolean;
  price?: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// داده‌های اولیه
const initialEducations: Education[] = [
  {
    id: '1',
    title: 'آموزش کامل React از صفر تا صد',
    description: 'دوره جامع آموزش React با تمام مفاهیم پیشرفته',
    category: 'course',
    level: 'beginner',
    duration: 1200,
    videoUrl: 'https://example.com/video1.mp4',
    thumbnailUrl: 'https://via.placeholder.com/400x300',
    content: 'محتوا کامل دوره...',
    tags: ['React', 'JavaScript', 'Frontend'],
    status: 'published',
    isFree: false,
    price: 500000,
    views: 1250,
    likes: 89,
    createdAt: '۱۴۰۳/۰۹/۱۵',
    updatedAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '2',
    title: 'مقاله: بهترین روش‌های SEO',
    description: 'راهنمای کامل بهینه‌سازی سایت برای موتورهای جستجو',
    category: 'article',
    level: 'intermediate',
    duration: 30,
    thumbnailUrl: 'https://via.placeholder.com/400x300',
    content: 'محتوا مقاله...',
    tags: ['SEO', 'Marketing'],
    status: 'published',
    isFree: true,
    views: 2340,
    likes: 156,
    createdAt: '۱۴۰۳/۰۹/۱۴',
    updatedAt: '۱۴۰۳/۰۹/۱۹',
  },
  {
    id: '3',
    title: 'ویدیو آموزش TypeScript',
    description: 'آموزش TypeScript در ۱۰ دقیقه',
    category: 'video',
    level: 'beginner',
    duration: 10,
    videoUrl: 'https://example.com/video2.mp4',
    thumbnailUrl: 'https://via.placeholder.com/400x300',
    tags: ['TypeScript', 'Programming'],
    status: 'published',
    isFree: true,
    views: 890,
    likes: 45,
    createdAt: '۱۴۰۳/۰۹/۱۳',
    updatedAt: '۱۴۰۳/۰۹/۱۸',
  },
  {
    id: '4',
    title: 'مستندات API',
    description: 'راهنمای کامل استفاده از API',
    category: 'documentation',
    level: 'advanced',
    content: 'مستندات کامل...',
    tags: ['API', 'Documentation'],
    status: 'draft',
    isFree: true,
    views: 0,
    likes: 0,
    createdAt: '۱۴۰۳/۰۹/۱۲',
    updatedAt: '۱۴۰۳/۰۹/۱۲',
  },
  {
    id: '5',
    title: 'آموزش Node.js پیشرفته',
    description: 'آموزش مفاهیم پیشرفته Node.js',
    category: 'tutorial',
    level: 'advanced',
    duration: 180,
    videoUrl: 'https://example.com/video3.mp4',
    thumbnailUrl: 'https://via.placeholder.com/400x300',
    tags: ['Node.js', 'Backend'],
    status: 'archived',
    isFree: false,
    price: 300000,
    views: 567,
    likes: 34,
    createdAt: '۱۴۰۳/۰۹/۱۰',
    updatedAt: '۱۴۰۳/۰۹/۱۷',
  },
];

const statusConfig = {
  draft: {
    label: 'پیش‌نویس',
    className: 'bg-muted text-muted-foreground',
    icon: FileEdit,
  },
  published: {
    label: 'منتشر شده',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  archived: {
    label: 'آرشیو شده',
    className: 'bg-warning/10 text-warning',
    icon: Archive,
  },
};

const levelConfig = {
  beginner: {
    label: 'مبتدی',
    className: 'bg-info/10 text-info',
  },
  intermediate: {
    label: 'متوسط',
    className: 'bg-primary/10 text-primary',
  },
  advanced: {
    label: 'پیشرفته',
    className: 'bg-warning/10 text-warning',
  },
};

const categoryConfig = {
  video: {
    label: 'ویدیو',
    className: 'bg-primary/10 text-primary',
    icon: Video,
  },
  article: {
    label: 'مقاله',
    className: 'bg-info/10 text-info',
    icon: FileText,
  },
  course: {
    label: 'دوره',
    className: 'bg-success/10 text-success',
    icon: BookOpen,
  },
  tutorial: {
    label: 'آموزش',
    className: 'bg-warning/10 text-warning',
    icon: GraduationCap,
  },
  documentation: {
    label: 'مستندات',
    className: 'bg-muted text-muted-foreground',
    icon: FileText,
  },
  other: {
    label: 'سایر',
    className: 'bg-muted text-muted-foreground',
    icon: FileText,
  },
};

type SortField = 'title' | 'category' | 'level' | 'status' | 'views' | 'likes' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Education() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEducations, setSelectedEducations] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewEducation, setViewEducation] = useState<Education | null>(null);
  const [editEducation, setEditEducation] = useState<Education | null>(null);
  const [deleteEducation, setDeleteEducation] = useState<Education | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('draft' | 'published' | 'archived')[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<('video' | 'article' | 'course' | 'tutorial' | 'documentation' | 'other')[]>([]);
  const [levelFilter, setLevelFilter] = useState<('beginner' | 'intermediate' | 'advanced')[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEducations, setTotalEducations] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load educations from API
  useEffect(() => {
    const loadEducations = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getTrainingVideos({
          page: currentPage,
          per_page: itemsPerPage,
          category_id: categoryFilter.length === 1 ? parseInt(categoryFilter[0]) : undefined,
        });

        if (response && (response.data || response.videos)) {
          const videosData = response.data?.videos || response.videos || [];
          const transformedEducations: Education[] = videosData.map((v: any) => ({
            id: v.id?.toString() || v.ID?.toString() || '',
            title: v.title || 'بدون عنوان',
            description: v.description || '',
            category: v.category || 'video',
            level: v.level || 'beginner',
            duration: v.duration || 0,
            videoUrl: v.video_url || v.videoUrl || '',
            thumbnailUrl: v.thumbnail_url || v.thumbnailUrl || '',
            content: v.content || '',
            tags: v.tags || [],
            status: v.status || 'published',
            isFree: v.is_free || false,
            price: v.price || 0,
            views: v.views || 0,
            likes: v.likes || 0,
            createdAt: v.created_at || new Date().toISOString(),
            updatedAt: v.updated_at || v.created_at || new Date().toISOString(),
          }));

          setEducations(transformedEducations);
          setTotalEducations(response.data?.total || response.total || 0);
          setTotalPages(response.data?.total_pages || response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading educations:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری محتوای آموزشی',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadEducations();
  }, [currentPage, itemsPerPage, categoryFilter]);

  // Use educations directly from API (already filtered and paginated)
  const paginatedEducations = educations;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleEducationAdded = () => {
    const stored = localStorage.getItem('asll-educations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEducations(parsed);
      } catch {}
    }
  };

  const toggleSelectEducation = (educationId: string) => {
    setSelectedEducations(prev =>
      prev.includes(educationId)
        ? prev.filter(id => id !== educationId)
        : [...prev, educationId]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteEducation = async () => {
    if (!deleteEducation) return;
    
    setIsDeleting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEducations(prev => prev.filter(e => e.id !== deleteEducation.id));
      setSelectedEducations(prev => prev.filter(id => id !== deleteEducation.id));
      setDeleteEducation(null);
      
      toast({
        title: 'موفقیت',
        description: 'محتوای آموزشی با موفقیت حذف شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف محتوای آموزشی',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedEducations.length === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEducations(prev => prev.map(education => {
        if (selectedEducations.includes(education.id)) {
          if (action === 'publish') {
            return { ...education, status: 'published' as const };
          } else if (action === 'archive') {
            return { ...education, status: 'archived' as const };
          }
          return education;
        }
        return education;
      }));

      if (action === 'delete') {
        setEducations(prev => prev.filter(e => !selectedEducations.includes(e.id)));
      }

      setSelectedEducations([]);
      
      toast({
        title: 'موفقیت',
        description: `عملیات با موفقیت انجام شد.`,
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در انجام عملیات',
        variant: 'destructive',
      });
    }
  };

  const handleResetFilters = () => {
    setStatusFilter([]);
    setCategoryFilter([]);
    setLevelFilter([]);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت محتوای آموزشی</h1>
            <p className="text-muted-foreground">لیست تمامی محتواهای آموزشی سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              محتوای جدید
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="جستجو بر اساس عنوان، توضیحات، برچسب یا شناسه..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <EducationFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  levelFilter={levelFilter}
                  onLevelFilterChange={setLevelFilter}
                  onReset={handleResetFilters}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </div>
                {(statusFilter.length > 0 || categoryFilter.length > 0 || levelFilter.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 ml-1" />
                    پاک کردن فیلترها
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedEducations.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sm text-foreground font-medium">
                  {selectedEducations.length} محتوا انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('publish')}
                    className="text-success hover:bg-success/10"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    انتشار
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('archive')}
                    className="text-warning hover:bg-warning/10"
                  >
                    <Archive className="w-4 h-4 ml-2" />
                    آرشیو
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedEducations.length} محتوا اطمینان دارید؟`)) {
                        handleBulkAction('delete');
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Educations Grid/List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست محتوا ({totalEducations})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedEducations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <GraduationCapIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ محتوای آموزشی یافت نشد</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedEducations.map((education, index) => {
                  const StatusIcon = statusConfig[education.status].icon;
                  const CategoryIcon = categoryConfig[education.category].icon;
                  return (
                    <Card
                      key={education.id}
                      className="overflow-hidden hover:shadow-lg transition-all animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {education.thumbnailUrl && (
                        <div className="relative h-48 w-full overflow-hidden">
                          <img
                            src={education.thumbnailUrl}
                            alt={education.title}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute top-2 left-2 flex gap-2">
                            <Badge
                              variant="outline"
                              className={cn('border-2', statusConfig[education.status].className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[education.status].label}
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant="outline"
                              className={cn('border-2', categoryConfig[education.category].className)}
                            >
                              <CategoryIcon className="w-3 h-3 ml-1" />
                              {categoryConfig[education.category].label}
                            </Badge>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-bold text-foreground mb-2 line-clamp-2">{education.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{education.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge variant="outline" className={cn('border-2', levelConfig[education.level].className)}>
                            {levelConfig[education.level].label}
                          </Badge>
                          {education.isFree ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              رایگان
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {education.price?.toLocaleString('fa-IR')} تومان
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <EyeIcon className="w-3 h-3" />
                              {education.views}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {education.likes}
                            </div>
                            {education.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {education.duration} دقیقه
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setViewEducation(education)}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            مشاهده
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditEducation(education)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteEducation(education)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">تصویر</th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          عنوان
                          {getSortIcon('title')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          دسته‌بندی
                          {getSortIcon('category')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('level')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          سطح
                          {getSortIcon('level')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          وضعیت
                          {getSortIcon('status')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('views')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          بازدید
                          {getSortIcon('views')}
                        </button>
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEducations.map((education, index) => {
                      const StatusIcon = statusConfig[education.status].icon;
                      const CategoryIcon = categoryConfig[education.category].icon;
                      return (
                        <tr
                          key={education.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            {education.thumbnailUrl ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                                <img
                                  src={education.thumbnailUrl}
                                  alt={education.title}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{education.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{education.description}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('border-2', categoryConfig[education.category].className)}
                            >
                              <CategoryIcon className="w-3 h-3 ml-1" />
                              {categoryConfig[education.category].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('border-2', levelConfig[education.level].className)}
                            >
                              {levelConfig[education.level].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('border-2', statusConfig[education.status].className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[education.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm">
                                <EyeIcon className="w-4 h-4 text-muted-foreground" />
                                {education.views}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Heart className="w-4 h-4 text-muted-foreground" />
                                {education.likes}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewEducation(education)}
                                title="مشاهده"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditEducation(education)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteEducation(education)}
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Pagination */}
            {!loading && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 mt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalEducations)} از {totalEducations} محتوا
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">۱۲</SelectItem>
                    <SelectItem value="24">۲۴</SelectItem>
                    <SelectItem value="48">۴۸</SelectItem>
                    <SelectItem value="96">۹۶</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  قبلی
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={currentPage === pageNum ? "gradient-primary text-primary-foreground" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  بعدی
                </Button>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog افزودن محتوا */}
      <AddEducationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleEducationAdded}
      />

      {/* Dialog مشاهده محتوا */}
      <ViewEducationDialog
        open={!!viewEducation}
        onOpenChange={(open) => !open && setViewEducation(null)}
        education={viewEducation}
      />

      {/* Dialog ویرایش محتوا */}
      <EditEducationDialog
        open={!!editEducation}
        onOpenChange={(open) => !open && setEditEducation(null)}
        education={editEducation}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-educations');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setEducations(parsed);
            } catch {}
          }
          setEditEducation(null);
        }}
      />

      {/* Dialog حذف محتوا */}
      <DeleteEducationDialog
        open={!!deleteEducation}
        onOpenChange={(open) => !open && setDeleteEducation(null)}
        education={deleteEducation}
        onConfirm={handleDeleteEducation}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

