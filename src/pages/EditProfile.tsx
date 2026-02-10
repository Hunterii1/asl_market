import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { getImageUrl } from "@/utils/imageUrl";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Camera } from "lucide-react";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    instagram: "",
    telegram: "",
    linkedin: "",
    whatsapp: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      // Try to parse existing social media links (stored as JSON string)
      let instagram = "";
      let telegram = "";
      let linkedin = "";
      let whatsapp = "";

      const rawSocial = (user as any).social_media_links as string | undefined;
      if (rawSocial) {
        try {
          const parsed = JSON.parse(rawSocial);
          instagram = parsed.instagram || "";
          telegram = parsed.telegram || "";
          linkedin = parsed.linkedin || "";
          whatsapp = parsed.whatsapp || "";
        } catch {
          // اگر قبلاً به صورت متن ساده ذخیره شده بود، همان را در فیلد اینستاگرام قرار می‌دهیم
          instagram = rawSocial;
        }
      }

      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        bio: (user as any).bio || "",
        location: (user as any).location || "",
        website: (user as any).website || "",
        instagram,
        telegram,
        linkedin,
        whatsapp,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // Build social media links object (stored as JSON string in backend, ولی کاربر JSON نمی‌بیند)
      const socialLinks: Record<string, string> = {};
      if (formData.instagram.trim()) socialLinks.instagram = formData.instagram.trim();
      if (formData.telegram.trim()) socialLinks.telegram = formData.telegram.trim();
      if (formData.linkedin.trim()) socialLinks.linkedin = formData.linkedin.trim();
      if (formData.whatsapp.trim()) socialLinks.whatsapp = formData.whatsapp.trim();

      await apiService.updateProfileInfo({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        social_media_links:
          Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : "",
      });
      
      toast({
        title: "موفق",
        description: "پروفایل با موفقیت به‌روزرسانی شد",
      });

      // Refresh user data
      if (refreshUserData) {
        await refreshUserData();
      }

      // Navigate back to profile
      navigate(`/profile/${user?.id}`);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی پروفایل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderAuth />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/profile/${user.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به پروفایل
          </Button>
        </div>

        <Card className="bg-card/80 border-border rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span>ویرایش پروفایل</span>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                پروفایل کامل = اعتماد و فروش بیشتر ✨
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Profile & Cover images - بخش آپلود بزرگ و شیک */}
            <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-400" />
                تصاویر پروفایل
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Image Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground">
                    عکس پروفایل
                  </label>
                  <div className="relative w-full aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-2xl group">
                    {(user as any).profile_image_url ? (
                      <img
                        src={getImageUrl((user as any).profile_image_url)}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <User className="w-20 h-20 text-white opacity-50" />
                    )}
                    
                    {/* Upload overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingImage(true);
                              const fd = new FormData();
                              fd.append("image", file);
                              await apiService.uploadProfileImage(fd);
                              toast({
                                title: "موفق",
                                description: "تصویر پروفایل به‌روزرسانی شد",
                              });
                              if (refreshUserData) {
                                await refreshUserData();
                              }
                            } catch (error: any) {
                              toast({
                                title: "خطا",
                                description: "خطا در آپلود تصویر پروفایل",
                                variant: "destructive",
                              });
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                          disabled={uploadingImage}
                        />
                        <div className="flex flex-col items-center gap-2 text-white">
                          <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                            <Camera className="w-8 h-8" />
                          </div>
                          <span className="text-sm font-medium">
                            {uploadingImage ? "در حال آپلود..." : "تغییر عکس"}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    کلیک کنید تا عکس پروفایل خود را تغییر دهید
                  </p>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground">
                    تصویر پس‌زمینه
                  </label>
                  <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-slate-600 flex items-center justify-center group cursor-pointer">
                    {(user as any).cover_image_url ? (
                      <img
                        src={getImageUrl((user as any).cover_image_url)}
                        alt="Cover"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <Camera className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                        <p className="text-sm text-muted-foreground">
                          هنوز تصویری انتخاب نکرده‌اید
                        </p>
                      </div>
                    )}
                    
                    {/* Upload overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingImage(true);
                              const fd = new FormData();
                              fd.append("image", file);
                              await apiService.uploadCoverImage(fd);
                              toast({
                                title: "موفق",
                                description: "تصویر پس‌زمینه به‌روزرسانی شد",
                              });
                              if (refreshUserData) {
                                await refreshUserData();
                              }
                            } catch (error: any) {
                              toast({
                                title: "خطا",
                                description: "خطا در آپلود تصویر پس‌زمینه",
                                variant: "destructive",
                              });
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                          disabled={uploadingImage}
                        />
                        <div className="flex flex-col items-center gap-2 text-white">
                          <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                            <Camera className="w-8 h-8" />
                          </div>
                          <span className="text-sm font-medium">
                            {uploadingImage ? "در حال آپلود..." : "تغییر تصویر"}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    تصویر پس‌زمینه در بالای پروفایل شما نمایش داده می‌شود
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">نام</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className="rounded-2xl"
                    placeholder="نام خود را وارد کنید"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">نام خانوادگی</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className="rounded-2xl"
                    placeholder="نام خانوادگی خود را وارد کنید"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="rounded-2xl"
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">بیوگرافی</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="rounded-2xl min-h-[100px]"
                  placeholder="توضیحاتی درباره خود بنویسید..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">موقعیت</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="rounded-2xl"
                  placeholder="شهر، کشور"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">وبسایت</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="rounded-2xl"
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-3">
                <Label>شبکه‌های اجتماعی</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="instagram" className="text-xs text-muted-foreground">
                      اینستاگرام
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram: e.target.value })
                      }
                      className="rounded-2xl"
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="telegram" className="text-xs text-muted-foreground">
                      تلگرام
                    </Label>
                    <Input
                      id="telegram"
                      value={formData.telegram}
                      onChange={(e) =>
                        setFormData({ ...formData, telegram: e.target.value })
                      }
                      className="rounded-2xl"
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="linkedin" className="text-xs text-muted-foreground">
                      لینکدین
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedin: e.target.value })
                      }
                      className="rounded-2xl"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="whatsapp" className="text-xs text-muted-foreground">
                      واتساپ
                    </Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      className="rounded-2xl"
                      placeholder="09xxxxxxxxx"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  فقط فیلدهایی را که می‌خواهید نمایش داده شود پر کنید.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>در حال ذخیره...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      ذخیره تغییرات
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="rounded-2xl"
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
