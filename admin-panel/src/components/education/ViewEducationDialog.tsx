import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap,
  FileText,
  Video,
  Image,
  Tag,
  Calendar,
  Eye,
  Heart,
  DollarSign,
  Clock,
  CheckCircle,
  Archive,
  FileEdit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EducationData {
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
  createdAt?: string;
  updatedAt?: string;
}

interface ViewEducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  education: EducationData | null;
}

const statusConfig = {
  draft: {
    label: 'پیش‌نویس',
    className: 'bg-muted text-muted-foreground border-border',
    icon: FileEdit,
  },
  published: {
    label: 'منتشر شده',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  archived: {
    label: 'آرشیو شده',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: Archive,
  },
};

const levelConfig = {
  beginner: {
    label: 'مبتدی',
    className: 'bg-info/10 text-info border-info/20',
  },
  intermediate: {
    label: 'متوسط',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  advanced: {
    label: 'پیشرفته',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

const categoryConfig = {
  video: { label: 'ویدیو', className: 'bg-primary/10 text-primary' },
  article: { label: 'مقاله', className: 'bg-info/10 text-info' },
  course: { label: 'دوره', className: 'bg-success/10 text-success' },
  tutorial: { label: 'آموزش', className: 'bg-warning/10 text-warning' },
  documentation: { label: 'مستندات', className: 'bg-muted text-muted-foreground' },
  other: { label: 'سایر', className: 'bg-muted text-muted-foreground' },
};

export function ViewEducationDialog({ open, onOpenChange, education }: ViewEducationDialogProps) {
  if (!education) return null;

  const StatusIcon = statusConfig[education.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="w-5 h-5 text-primary" />
            {education.title}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل محتوای آموزشی
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{education.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[education.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[education.status].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', levelConfig[education.level].className)}
                    >
                      {levelConfig[education.level].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', categoryConfig[education.category].className)}
                    >
                      {categoryConfig[education.category].label}
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
                </div>
                {education.thumbnailUrl && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-border flex items-center justify-center shrink-0">
                    <img src={education.thumbnailUrl} alt={education.title} className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-2">توضیحات</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{education.description}</p>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">آمار</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Eye className="w-4 h-4" />
                    بازدید
                  </div>
                  <p className="text-xl font-bold text-foreground">{education.views.toLocaleString('fa-IR')}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Heart className="w-4 h-4" />
                    لایک
                  </div>
                  <p className="text-xl font-bold text-foreground">{education.likes.toLocaleString('fa-IR')}</p>
                </div>
                {education.duration && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      مدت زمان
                    </div>
                    <p className="text-xl font-bold text-foreground">{education.duration} دقیقه</p>
                  </div>
                )}
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    قیمت
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {education.isFree ? 'رایگان' : `${education.price?.toLocaleString('fa-IR')} تومان`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video */}
          {education.videoUrl && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  ویدیو
                </h4>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <video
                    src={education.videoUrl}
                    controls
                    className="w-full h-full"
                  >
                    مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {education.content && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  محتوا
                </h4>
                <div className="prose prose-sm max-w-none text-foreground">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg">
                    {education.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {education.tags && education.tags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  برچسب‌ها
                </h4>
                <div className="flex flex-wrap gap-2">
                  {education.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی</h4>
              <div className="grid grid-cols-2 gap-4">
                {education.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">{education.createdAt}</p>
                    </div>
                  </div>
                )}
                {education.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                      <p className="text-sm font-medium text-foreground">{education.updatedAt}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

