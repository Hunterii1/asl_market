import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { ContactViewButton } from "@/components/ContactViewButton";
import { getImageUrl } from "@/utils/imageUrl";
import {
  User,
  Building,
  Package,
  MapPin,
  Star,
  Calendar,
  Globe,
  MessageCircle,
  Camera,
  Link as LinkIcon,
  Edit,
  CheckCircle,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const toFarsiNumber = (num: number | string) => {
  if (typeof num === "string") {
    return num.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  return num.toLocaleString("fa-IR");
};

interface UserProfile {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    profile_image_url?: string;
    cover_image_url?: string;
    bio?: string;
    location?: string;
    website?: string;
    social_media_links?: string;
    created_at: string;
  };
  is_supplier: boolean;
  supplier?: {
    id: number;
    full_name: string;
    brand_name: string;
    city: string;
    image_url?: string;
    is_featured: boolean;
    average_rating: number;
    total_ratings: number;
    status: string;
    tag_first_class?: boolean;
    tag_good_price?: boolean;
    tag_export_experience?: boolean;
    tag_export_packaging?: boolean;
    tag_supply_without_capital?: boolean;
  };
  is_visitor: boolean;
  visitor?: {
    id: number;
    full_name: string;
    city_province: string;
    destination_cities: string;
    is_featured: boolean;
    average_rating: number;
    total_ratings: number;
    status: string;
  };
  has_license: boolean;
  license?: {
    is_active: boolean;
    expires_at: string;
  };
  products_count?: number;
  matching_requests_count?: number;
  visitor_projects_count?: number;
  matching_responses_count?: number;
  recent_matching_requests?: any[];
  recent_visitor_projects?: any[];
  activity?: {
    total_chats: number;
    member_since: string;
  };
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const isOwnProfile = currentUser?.id === parseInt(id || "0");

  // Parse social media links (stored as JSON string in backend, ولی کاربر JSON نمی‌بیند)
  const socialLinks = (() => {
    if (!profile?.user.social_media_links) return null;
    try {
      return JSON.parse(profile.user.social_media_links) as {
        instagram?: string;
        telegram?: string;
        linkedin?: string;
        whatsapp?: string;
      };
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);
  const loadProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await apiService.getUserProfile(parseInt(id, 10));
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در بارگذاری پروفایل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfileImage = async (file: File) => {
    if (!isOwnProfile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      await apiService.uploadProfileImage(formData);
      
      toast({
        title: "موفق",
        description: "تصویر پروفایل با موفقیت آپلود شد",
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: "خطا در آپلود تصویر",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCoverImage = async (file: File) => {
    if (!isOwnProfile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      await apiService.uploadCoverImage(formData);
      
      toast({
        title: "موفق",
        description: "تصویر پس‌زمینه با موفقیت آپلود شد",
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: "خطا در آپلود تصویر",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <HeaderAuth />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <HeaderAuth />
        <div className="container mx-auto px-4 py-20">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>کاربر یافت نشد</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderAuth />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cover Image */}
        <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-3xl overflow-hidden mb-6 group shadow-2xl">
          {profile.user.cover_image_url ? (
            <img
              src={getImageUrl(profile.user.cover_image_url)}
              alt="Cover"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500/30 via-purple-500/30 to-blue-500/30 animate-gradient-xy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {isOwnProfile && (
            <label className="absolute top-4 left-4 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUploadCoverImage(e.target.files[0])}
                disabled={uploading}
              />
              <div className="p-3 bg-black/60 hover:bg-black/80 rounded-2xl backdrop-blur-sm border border-white/10 transition-all">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </label>
          )}

          {/* Profile Image (overlapping cover) */}
          <div className="absolute -bottom-20 right-8 sm:right-12 group/avatar">
            <div className="relative">
              <div className="w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-3xl border-4 border-slate-950 overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 shadow-2xl ring-4 ring-orange-500/20 group-hover/avatar:ring-orange-500/40 transition-all duration-300">
                {profile.user.profile_image_url ? (
                  <img
                    src={getImageUrl(profile.user.profile_image_url)}
                    alt={`${profile.user.first_name} ${profile.user.last_name}`}
                    className="w-full h-full object-cover transform group-hover/avatar:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-20 h-20 text-white" />
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <label className="absolute bottom-2 left-2 cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadProfileImage(e.target.files[0])}
                    disabled={uploading}
                  />
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full shadow-lg transition-all transform group-hover:scale-110 ring-2 ring-white/30">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mt-24 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {profile.user.first_name} {profile.user.last_name}
                </h1>
                {profile.has_license && profile.license?.is_active && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 rounded-xl">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    دارای لایسنس
                  </Badge>
                )}
              </div>

              {profile.user.bio && (
                <p className="text-muted-foreground mb-3 max-w-2xl">{profile.user.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm">
                {profile.user.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.user.location}</span>
                  </div>
                )}
                {profile.activity && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>عضو از {profile.activity.member_since}</span>
                  </div>
                )}
                {profile.user.website && (
                  <a
                    href={profile.user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>{profile.user.website}</span>
                  </a>
                )}
                {socialLinks && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {socialLinks.instagram && (
                      <a
                        href={
                          socialLinks.instagram.startsWith("http")
                            ? socialLinks.instagram
                            : `https://instagram.com/${socialLinks.instagram.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-full text-xs bg-pink-500/10 text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 transition-colors"
                      >
                        اینستاگرام
                      </a>
                    )}
                    {socialLinks.telegram && (
                      <a
                        href={
                          socialLinks.telegram.startsWith("http")
                            ? socialLinks.telegram
                            : `https://t.me/${socialLinks.telegram.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-full text-xs bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-colors"
                      >
                        تلگرام
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                      >
                        لینکدین
                      </a>
                    )}
                    {socialLinks.whatsapp && (
                      <a
                        href={`https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                      >
                        واتساپ
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <Button
                onClick={() => navigate("/edit-profile")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl"
              >
                <Edit className="w-4 h-4 mr-2" />
                ویرایش پروفایل
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {profile.is_supplier && (
            <>
              <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/20 border-orange-500/30">
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(profile.products_count || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">محصول</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-500/30">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(profile.matching_requests_count || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">درخواست مچینگ</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(profile.supplier?.average_rating?.toFixed(1) || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    از {toFarsiNumber(profile.supplier?.total_ratings || 0)} نظر
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {profile.is_visitor && (
            <>
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border-purple-500/30">
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(profile.visitor_projects_count || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">پروژه ویزیتوری</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(profile.matching_responses_count || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">پاسخ به مچینگ</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(profile.visitor?.average_rating?.toFixed(1) || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    از {toFarsiNumber(profile.visitor?.total_ratings || 0)} نظر
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="bg-gradient-to-br from-sky-900/20 to-sky-950/20 border-sky-500/30">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {toFarsiNumber(profile.activity?.total_chats || 0)}
              </p>
              <p className="text-xs text-muted-foreground">چت</p>
            </CardContent>
          </Card>
        </div>

        {/* Supplier/Visitor Info */}
        {profile.is_supplier && profile.supplier && (
          <Card className="bg-gradient-to-br from-orange-900/10 to-orange-950/10 border-orange-500/30 rounded-3xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <Building className="w-5 h-5 text-orange-300" />
                </div>
                اطلاعات تأمین‌کننده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">نام برند</p>
                  <p className="text-lg font-bold text-foreground">
                    {profile.supplier.brand_name || profile.supplier.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">شهر</p>
                  <p className="text-lg font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    {profile.supplier.city}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.supplier.is_featured && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                    <Star className="w-3 h-3 mr-1" />
                    تأمین‌کننده برگزیده
                  </Badge>
                )}
                {profile.supplier.tag_first_class && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                    دسته اول
                  </Badge>
                )}
                {profile.supplier.tag_good_price && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    خوش قیمت
                  </Badge>
                )}
                {profile.supplier.tag_export_experience && (
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40">
                    سابقه صادرات
                  </Badge>
                )}
                {profile.supplier.tag_export_packaging && (
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/40">
                    بسته‌بندی صادراتی
                  </Badge>
                )}
                {profile.supplier.tag_supply_without_capital && (
                  <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/40">
                    تأمین بدون سرمایه
                  </Badge>
                )}
              </div>

              {!isOwnProfile && profile.supplier.status === "approved" && (
                <ContactViewButton
                  targetType="supplier"
                  targetId={profile.supplier.id}
                  targetName={profile.supplier.brand_name || profile.supplier.full_name}
                  className="rounded-2xl"
                />
              )}
            </CardContent>
          </Card>
        )}

        {profile.is_visitor && profile.visitor && (
          <Card className="bg-gradient-to-br from-purple-900/10 to-purple-950/10 border-purple-500/30 rounded-3xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-300" />
                </div>
                اطلاعات ویزیتور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">شهر/استان</p>
                  <p className="text-lg font-bold text-foreground">
                    {profile.visitor.city_province}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">شهرهای مقصد</p>
                  <p className="text-lg font-bold text-foreground">
                    {profile.visitor.destination_cities}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.visitor.is_featured && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                    <Star className="w-3 h-3 mr-1" />
                    ویزیتور برگزیده
                  </Badge>
                )}
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                  امتیاز: {toFarsiNumber(profile.visitor.average_rating?.toFixed(1) || 0)} از{" "}
                  {toFarsiNumber(profile.visitor.total_ratings || 0)} نظر
                </Badge>
              </div>

              {!isOwnProfile && profile.visitor.status === "approved" && (
                <ContactViewButton
                  targetType="visitor"
                  targetId={profile.visitor.id}
                  targetName={profile.visitor.full_name}
                  className="rounded-2xl"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">نگاه کلی</TabsTrigger>
            <TabsTrigger value="activity">فعالیت‌ها</TabsTrigger>
            <TabsTrigger value="about">درباره</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {profile.is_supplier && profile.recent_matching_requests && profile.recent_matching_requests.length > 0 && (
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    درخواست‌های اخیر مچینگ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.recent_matching_requests.slice(0, 5).map((req: any) => (
                      <div
                        key={req.id}
                        className="p-4 bg-slate-900/40 rounded-2xl border border-slate-700/40 hover:border-orange-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{req.product_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {toFarsiNumber(req.quantity)} {req.unit} - {toFarsiNumber(req.price)}{" "}
                              {req.currency}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              req.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : req.status === "accepted"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-slate-500/20 text-slate-300"
                            )}
                          >
                            {req.status === "active"
                              ? "فعال"
                              : req.status === "accepted"
                              ? "پذیرفته شده"
                              : req.status === "completed"
                              ? "مختوم"
                              : req.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.is_visitor && profile.recent_visitor_projects && profile.recent_visitor_projects.length > 0 && (
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    پروژه‌های اخیر ویزیتوری
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.recent_visitor_projects.slice(0, 5).map((proj: any) => (
                      <div
                        key={proj.id}
                        className="p-4 bg-slate-900/40 rounded-2xl border border-slate-700/40 hover:border-purple-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{proj.project_title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {proj.product_name} - {toFarsiNumber(proj.quantity)} {proj.unit}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              proj.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : proj.status === "accepted"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-slate-500/20 text-slate-300"
                            )}
                          >
                            {proj.status === "active"
                              ? "فعال"
                              : proj.status === "accepted"
                              ? "پذیرفته شده"
                              : proj.status === "completed"
                              ? "مختوم"
                              : proj.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>فعالیت‌های اخیر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.is_supplier && (
                    <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-2xl">
                      <Building className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="font-semibold text-foreground">تأمین‌کننده</p>
                        <p className="text-sm text-muted-foreground">
                          {toFarsiNumber(profile.matching_requests_count || 0)} درخواست مچینگ ثبت شده
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.is_visitor && (
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-2xl">
                      <Users className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-semibold text-foreground">ویزیتور</p>
                        <p className="text-sm text-muted-foreground">
                          {toFarsiNumber(profile.visitor_projects_count || 0)} پروژه ویزیتوری ثبت شده
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-sky-500/10 rounded-2xl">
                    <MessageCircle className="w-5 h-5 text-sky-400" />
                    <div>
                      <p className="font-semibold text-foreground">چت‌ها</p>
                      <p className="text-sm text-muted-foreground">
                        {toFarsiNumber(profile.activity?.total_chats || 0)} چت فعال
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>درباره</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.user.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">بیوگرافی</p>
                    <p className="text-foreground">{profile.user.bio}</p>
                  </div>
                )}
                {profile.user.location && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">موقعیت</p>
                    <p className="text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      {profile.user.location}
                    </p>
                  </div>
                )}
                {profile.user.website && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">وبسایت</p>
                    <a
                      href={profile.user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      {profile.user.website}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">عضویت از</p>
                  <p className="text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    {profile.activity?.member_since}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
