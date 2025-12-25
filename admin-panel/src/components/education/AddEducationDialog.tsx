import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, GraduationCap, FileText, Video, Image, Tag, DollarSign, Eye, Heart } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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
import { addEducationSchema, type AddEducationFormData } from '@/lib/validations/education';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface AddEducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createEducation = async (data: AddEducationFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const educations = JSON.parse(localStorage.getItem('asll-educations') || '[]');
        const newEducation = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toLocaleDateString('fa-IR'),
          updatedAt: new Date().toLocaleDateString('fa-IR'),
        };
        educations.push(newEducation);
        localStorage.setItem('asll-educations', JSON.stringify(educations));
        resolve();
      }
    }, 1500);
  });
};

export function AddEducationDialog({ open, onOpenChange, onSuccess }: AddEducationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [tagsInput, setTagsInput] = useState('');

  const form = useForm<AddEducationFormData>({
    resolver: zodResolver(addEducationSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'article',
      level: 'beginner',
      duration: 0,
      videoUrl: '',
      thumbnailUrl: '',
      content: '',
      tags: [],
      status: 'draft',
      isFree: true,
      price: 0,
      views: 0,
      likes: 0,
    },
  });

  const { watch, setValue } = form;
  const tags = watch('tags');
  const thumbnailUrl = watch('thumbnailUrl');
  const isFree = watch('isFree');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagsInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagsInput.trim();
      if (newTag && !tags?.includes(newTag)) {
        setValue('tags', [...(tags || []), newTag]);
        setTagsInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', (tags || []).filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: AddEducationFormData) => {
    setIsSubmitting(true);
    try {
      await createEducation(data);
      toast({
        title: 'موفقیت',
        description: 'محتوای آموزشی با موفقیت ایجاد شد.',
        variant: 'default',
      });
      form.reset();
      setCurrentTab('basic');
      setTagsInput('');
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
        setTagsInput('');
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="w-5 h-5 text-primary" />
            ایجاد محتوای آموزشی جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات محتوای آموزشی جدید را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="content">محتوا</TabsTrigger>
                <TabsTrigger value="settings">تنظیمات</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* عنوان */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        عنوان
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: آموزش کامل React"
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

                {/* توضیحات */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات کوتاه</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="توضیحات مختصر درباره محتوا..."
                          className="min-h-[100px]"
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
                  {/* دسته‌بندی */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>دسته‌بندی</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video">ویدیو</SelectItem>
                            <SelectItem value="article">مقاله</SelectItem>
                            <SelectItem value="course">دوره</SelectItem>
                            <SelectItem value="tutorial">آموزش</SelectItem>
                            <SelectItem value="documentation">مستندات</SelectItem>
                            <SelectItem value="other">سایر</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* سطح */}
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سطح</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="سطح را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">مبتدی</SelectItem>
                            <SelectItem value="intermediate">متوسط</SelectItem>
                            <SelectItem value="advanced">پیشرفته</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* مدت زمان */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدت زمان (دقیقه)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="مثال: ۶۰"
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
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                {/* آدرس ویدیو */}
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        آدرس ویدیو (اختیاری)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/video.mp4"
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

                {/* آدرس تصویر */}
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-muted-foreground" />
                        آدرس تصویر شاخص (اختیاری)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          disabled={isSubmitting}
                          dir="ltr"
                          className="text-left"
                        />
                      </FormControl>
                      {thumbnailUrl && (
                        <div className="mt-2 w-32 h-32 rounded-md overflow-hidden border border-border flex items-center justify-center">
                          <img src={thumbnailUrl} alt="Thumbnail Preview" className="object-cover w-full h-full" />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* محتوا */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محتوا (اختیاری)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="محتوا یا متن کامل مقاله..."
                          className="min-h-[200px] font-mono text-sm"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 50000 کاراکتر
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* برچسب‌ها */}
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    برچسب‌ها
                  </FormLabel>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="برچسب جدید را وارد کرده و Enter بزنید"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    disabled={isSubmitting}
                  />
                  <FormDescription>
                    با فشردن Enter برچسب‌ها را اضافه کنید.
                  </FormDescription>
                </FormItem>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                {/* وضعیت */}
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
                          <SelectItem value="draft">پیش‌نویس</SelectItem>
                          <SelectItem value="published">منتشر شده</SelectItem>
                          <SelectItem value="archived">آرشیو شده</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* رایگان/پولی */}
                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isFree"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="isFree" className="cursor-pointer">
                          محتوای رایگان
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* قیمت */}
                {!isFree && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          قیمت (تومان)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="مثال: ۱۰۰۰۰۰"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting}
                            className="text-right"
                            min="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                    <GraduationCap className="w-4 h-4 ml-2" />
                    ایجاد محتوا
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

