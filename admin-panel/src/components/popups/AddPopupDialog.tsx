import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Megaphone, FileText, Layout, Calendar, Users, Link, Palette, Clock, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addPopupSchema, type AddPopupFormData } from '@/lib/validations/popup';
import { toast } from '@/hooks/use-toast';

interface AddPopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createPopup = async (data: AddPopupFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const popups = JSON.parse(localStorage.getItem('asll-popups') || '[]');
        const newPopup = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toLocaleDateString('fa-IR'),
          updatedAt: new Date().toLocaleDateString('fa-IR'),
        };
        popups.push(newPopup);
        localStorage.setItem('asll-popups', JSON.stringify(popups));
        resolve();
      }
    }, 1500);
  });
};

export function AddPopupDialog({ open, onOpenChange, onSuccess }: AddPopupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  const form = useForm<AddPopupFormData>({
    resolver: zodResolver(addPopupSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'modal',
      position: 'center',
      status: 'inactive',
      startDate: '',
      endDate: '',
      showOnPages: [],
      showToUsers: 'all',
      specificUserIds: [],
      buttonText: '',
      buttonLink: '',
      closeButton: true,
      showDelay: 0,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      width: 500,
      height: 300,
      displayCount: 0,
      clickCount: 0,
    },
  });

  const { watch } = form;
  const type = watch('type');
  const showToUsers = watch('showToUsers');

  const onSubmit = async (data: AddPopupFormData) => {
    setIsSubmitting(true);
    try {
      await createPopup(data);
      toast({
        title: 'موفقیت',
        description: 'پاپ‌آپ با موفقیت ایجاد شد.',
        variant: 'default',
      });
      form.reset();
      setCurrentTab('basic');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        form.reset();
        setCurrentTab('basic');
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Megaphone className="w-5 h-5 text-primary" />
            ایجاد پاپ‌آپ جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات پاپ‌آپ جدید را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="display">نمایش</TabsTrigger>
                <TabsTrigger value="design">طراحی</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        عنوان *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: تخفیف ویژه!"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 200 کاراکتر
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محتوا *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="متن پاپ‌آپ..."
                          className="min-h-[150px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 5000 کاراکتر
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Layout className="w-4 h-4 text-muted-foreground" />
                          نوع پاپ‌آپ *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="نوع را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="modal">Modal (پنجره)</SelectItem>
                            <SelectItem value="banner">Banner (بنر)</SelectItem>
                            <SelectItem value="toast">Toast (اعلان)</SelectItem>
                            <SelectItem value="slide_in">Slide-in (کشویی)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Position */}
                  {type !== 'modal' && (
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>موقعیت نمایش</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger className="text-right">
                                <SelectValue placeholder="موقعیت را انتخاب کنید" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="top">بالا</SelectItem>
                              <SelectItem value="bottom">پایین</SelectItem>
                              <SelectItem value="left">چپ</SelectItem>
                              <SelectItem value="right">راست</SelectItem>
                              <SelectItem value="center">وسط</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وضعیت</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="وضعیت را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">فعال</SelectItem>
                            <SelectItem value="inactive">غیرفعال</SelectItem>
                            <SelectItem value="scheduled">زمان‌بندی شده</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          تاریخ شروع
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          تاریخ پایان
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="display" className="space-y-4 mt-4">
                {/* Show To Users */}
                <FormField
                  control={form.control}
                  name="showToUsers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        نمایش به کاربران
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="نوع کاربران را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">همه کاربران</SelectItem>
                          <SelectItem value="logged_in">فقط کاربران وارد شده</SelectItem>
                          <SelectItem value="logged_out">فقط کاربران خارج شده</SelectItem>
                          <SelectItem value="specific">کاربران خاص</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show Delay */}
                <FormField
                  control={form.control}
                  name="showDelay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        تاخیر نمایش (ثانیه)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                          className="text-right"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Close Button */}
                <FormField
                  control={form.control}
                  name="closeButton"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="closeButton"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="closeButton" className="cursor-pointer">
                          نمایش دکمه بستن
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Button Text */}
                <FormField
                  control={form.control}
                  name="buttonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>متن دکمه</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: مشاهده بیشتر"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Button Link */}
                <FormField
                  control={form.control}
                  name="buttonLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        آدرس دکمه
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                          disabled={isSubmitting}
                          dir="ltr"
                          className="text-left"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="design" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Background Color */}
                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-muted-foreground" />
                          رنگ پس‌زمینه
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              {...field}
                              disabled={isSubmitting}
                              className="w-16 h-10"
                            />
                            <Input
                              placeholder="#ffffff"
                              {...field}
                              disabled={isSubmitting}
                              dir="ltr"
                              className="text-left flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Text Color */}
                  <FormField
                    control={form.control}
                    name="textColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-muted-foreground" />
                          رنگ متن
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              {...field}
                              disabled={isSubmitting}
                              className="w-16 h-10"
                            />
                            <Input
                              placeholder="#000000"
                              {...field}
                              disabled={isSubmitting}
                              dir="ltr"
                              className="text-left flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Width */}
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عرض (پیکسل)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 500)}
                            disabled={isSubmitting}
                            className="text-right"
                            min="100"
                            max="2000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Height */}
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ارتفاع (پیکسل)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="300"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 300)}
                            disabled={isSubmitting}
                            className="text-right"
                            min="100"
                            max="2000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Preview */}
                <div className="border border-border rounded-lg p-4 bg-muted/30">
                  <Label className="text-sm font-semibold mb-2 block">پیش‌نمایش</Label>
                  <div
                    className="rounded-lg p-4 mx-auto"
                    style={{
                      backgroundColor: watch('backgroundColor') || '#ffffff',
                      color: watch('textColor') || '#000000',
                      width: `${watch('width') || 500}px`,
                      minHeight: `${watch('height') || 300}px`,
                      maxWidth: '100%',
                    }}
                  >
                    <h3 className="font-bold text-lg mb-2">{watch('title') || 'عنوان پاپ‌آپ'}</h3>
                    <p className="text-sm mb-4">{watch('content') || 'محتوا...'}</p>
                    {watch('buttonText') && (
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => e.preventDefault()}
                      >
                        {watch('buttonText')}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ایجاد...
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4 ml-2" />
                    ایجاد پاپ‌آپ
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

