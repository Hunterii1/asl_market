import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/utils/imageUrl';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  uploadType: 'supplier' | 'product';
  label?: string;
  maxSize?: number; // in MB
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  uploadType,
  label = 'تصویر',
  maxSize = 5,
}) => {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error
    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('لطفا فقط فایل تصویری انتخاب کنید');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`حجم فایل نباید بیشتر از ${maxSize}MB باشد`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const endpoint = uploadType === 'supplier' 
        ? '/upload/supplier-image' 
        : '/upload/product-image';

      const response = await apiService.uploadImage(formData, endpoint);
      
      if (response.image_url) {
        onImageChange(response.image_url);
        toast({
          title: "موفق",
          description: "تصویر با موفقیت آپلود شد",
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'خطا در آپلود تصویر');
      setPreview(currentImage || '');
      toast({
        title: "خطا",
        description: error.response?.data?.error || 'خطا در آپلود تصویر',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <Card className="relative overflow-hidden">
          <div className="aspect-video relative bg-muted">
            <img
              src={getImageUrl(preview)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            {!uploading && (
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card
          onClick={handleButtonClick}
          className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
        >
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  برای انتخاب تصویر کلیک کنید
                </p>
                <p className="text-xs text-muted-foreground">
                  فرمت‌های مجاز: JPG, PNG, GIF, WebP (حداکثر {maxSize}MB)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
              >
                <Upload className="w-4 h-4 ml-2" />
                {uploading ? 'در حال آپلود...' : 'انتخاب تصویر'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
