import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/utils/imageUrl";
import {
  Building,
  Users,
  Star,
  MapPin,
  ShieldCheck,
  Globe2,
  Package,
  ArrowLeft,
} from "lucide-react";
import { ContactViewButton } from "@/components/ContactViewButton";

interface SupplierPreviewDialogProps {
  supplier: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** اگر true باشد دکمه دیدن اطلاعات تماس را هم نشان می‌دهیم (در صفحات محافظت‌شده) */
  showContactButton?: boolean;
}

export function SupplierPreviewDialog({
  supplier,
  open,
  onOpenChange,
  showContactButton = false,
}: SupplierPreviewDialogProps) {
  const navigate = useNavigate();

  if (!supplier) return null;

  const {
    id,
    brand_name,
    full_name,
    city,
    image_url,
    is_featured,
    tag_first_class,
    tag_good_price,
    tag_export_experience,
    tag_export_packaging,
    tag_supply_without_capital,
    average_rating,
    total_ratings,
    has_export_experience,
    can_produce_private_label,
    has_registered_business,
  } = supplier;

  const displayName = brand_name || full_name;
  const rating = typeof average_rating === "number" && average_rating > 0 ? average_rating : is_featured ? 5 : 0;

  const toFarsiNumber = (num: number) => {
    return num.toLocaleString("fa-IR");
  };

  const handleGoToSuppliersPage = () => {
    onOpenChange(false);
    navigate("/aslsupplier");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-orange-500/30 rounded-3xl shadow-2xl p-0 overflow-hidden" dir="rtl">
        {/* Header image */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-transparent to-purple-700/40 pointer-events-none" />
          {image_url ? (
            <img
              src={getImageUrl(image_url)}
              alt={displayName}
              className="w-full h-full object-cover scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-purple-600/10">
              <Building className="w-12 h-12 text-orange-300" />
            </div>
          )}

          {/* Gradient overlay bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Main title */}
          <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Users className="w-5 h-5 text-orange-200" />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-base sm:text-lg font-bold text-white line-clamp-1">
                  {displayName}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-xs text-orange-100/90">
                  {city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{city}</span>
                    </span>
                  )}
                  {is_featured && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-300" />
                      <span>برگزیده</span>
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-black/60 text-yellow-300 border-yellow-400/40 rounded-xl text-[11px] px-2 py-1">
                {toFarsiNumber(rating || 0)}★
              </Badge>
              {total_ratings > 0 && (
                <span className="text-[10px] text-white/70">
                  {toFarsiNumber(total_ratings)} نظر
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          {/* Tags & highlights */}
          <div className="flex flex-wrap gap-2">
            {tag_first_class && (
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/40 rounded-xl text-[10px]">
                تأمین‌کننده دسته اول
              </Badge>
            )}
            {tag_good_price && (
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/40 rounded-xl text-[10px]">
                خوش قیمت
              </Badge>
            )}
            {tag_export_experience && (
              <Badge className="bg-sky-500/20 text-sky-200 border-sky-500/40 rounded-xl text-[10px]">
                سابقه صادرات
              </Badge>
            )}
            {tag_export_packaging && (
              <Badge className="bg-violet-500/20 text-violet-200 border-violet-500/40 rounded-xl text-[10px]">
                بسته‌بندی صادراتی
              </Badge>
            )}
            {tag_supply_without_capital && (
              <Badge className="bg-slate-500/20 text-slate-200 border-slate-500/40 rounded-xl text-[10px]">
                تأمین بدون سرمایه
              </Badge>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-900/60 border-slate-700/60 rounded-2xl">
              <CardContent className="p-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-300">مجوز کسب‌وکار</span>
                  <span className="text-xs font-semibold text-emerald-300">
                    {has_registered_business ? "دارد" : "در حال تکمیل"}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60 border-slate-700/60 rounded-2xl">
              <CardContent className="p-3 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-sky-400" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-300">صادرات</span>
                  <span className="text-xs font-semibold text-sky-300">
                    {has_export_experience || tag_export_experience ? "سابقه صادرات" : "در حال توسعه"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-900/60 border-slate-700/60 rounded-2xl">
              <CardContent className="p-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-300" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-300">نوع همکاری</span>
                  <span className="text-xs font-semibold text-orange-200">
                    {tag_supply_without_capital ? "تأمین بدون سرمایه" : "استاندارد"}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60 border-slate-700/60 rounded-2xl">
              <CardContent className="p-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-300" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-300">برند اختصاصی</span>
                  <span className="text-xs font-semibold text-purple-200">
                    {can_produce_private_label ? "تولید برند اختصاصی دارد" : "فعلاً ندارد"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-1">
            {showContactButton && id && (
              <ContactViewButton
                targetType="supplier"
                targetId={id}
                targetName={displayName}
                className="flex-1 rounded-2xl justify-center"
                variant="outline"
                size="sm"
              />
            )}
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl flex items-center justify-center gap-2"
              onClick={handleGoToSuppliersPage}
            >
              <span>مشاهده همه تأمین‌کنندگان</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

