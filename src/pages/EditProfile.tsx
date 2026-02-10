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
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User } from "lucide-react";

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
    social_media_links: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        bio: (user as any).bio || "",
        location: (user as any).location || "",
        website: (user as any).website || "",
        social_media_links: (user as any).social_media_links || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await apiService.updateProfileInfo(formData);
      
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
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              ویرایش پروفایل
            </CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="space-y-2">
                <Label htmlFor="social_media_links">لینک‌های شبکه‌های اجتماعی</Label>
                <Textarea
                  id="social_media_links"
                  value={formData.social_media_links}
                  onChange={(e) =>
                    setFormData({ ...formData, social_media_links: e.target.value })
                  }
                  className="rounded-2xl min-h-[80px]"
                  placeholder='{"instagram": "@username", "telegram": "@username"}'
                />
                <p className="text-xs text-muted-foreground">
                  فرمت JSON: مثال بالا را ببینید
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
