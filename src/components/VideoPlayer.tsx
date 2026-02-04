import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { BASE_DOMAIN, getApiBaseUrl } from '../config/domain';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  CheckCircle,
  X,
  FileText
} from 'lucide-react';

interface VideoPlayerProps {
  video: {
    id: number;
    title: string;
    description?: string;
    video_url?: string;
    telegram_file_id?: string;
    type: 'video' | 'link';
    duration?: string;
    views?: number;
    difficulty?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onVideoWatched: (videoId: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  isOpen,
  onClose,
  onVideoWatched
}) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasWatched, setHasWatched] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchThreshold = 0.8; // 80% watched counts as completion

  // Debug video data on mount
  useEffect(() => {
    console.log('🎬 VideoPlayer mounted with video:', video);
    console.log('🎬 Video URL:', getVideoUrl());
    console.log('🎬 Can play inline:', canPlayInline());
    
    // Reset states when video changes
    setVideoError(null);
    setIsLoading(true);
    setHasWatched(false);
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    
    // Add protection against right-click and shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')
      ) {
        e.preventDefault();
        toast({
          title: "🚫 عملیات مجاز نیست",
          description: "دانلود و ذخیره ویدیو مجاز نمی‌باشد",
          variant: "destructive"
        });
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [video]);

  // Handle video load start
  const handleLoadStart = () => {
    console.log('🎬 Video load started');
    setIsLoading(true);
    setVideoError(null);
  };

  // Handle video can play
  const handleCanPlay = () => {
    console.log('🎬 Video can play');
    setIsLoading(false);
    setVideoError(null);
  };

  // Handle video load error
  const handleVideoError = (e: any) => {
    console.error('🎬 Video load error:', e);
    const error = videoRef.current?.error;
    let errorMessage = 'خطا در بارگذاری ویدیو';
    let shouldFallbackToExternal = false;
    
    // Check current video URL
    const currentVideoUrl = videoRef.current?.src || video.video_url;
    console.log('🎬 Error with video URL:', currentVideoUrl);
    
    // Check if URL looks malformed (duplicate or wrong domain in path)
    const malformed = currentVideoUrl && (
      currentVideoUrl.includes('asllmarket.org/asllmarket.ir/') ||
      currentVideoUrl.includes(`${BASE_DOMAIN}/${BASE_DOMAIN}/`)
    );
    if (malformed) {
      errorMessage = 'خطا: URL ویدیو اشتباه است (مسیر تکراری)';
      shouldFallbackToExternal = true;
    }
    // Check for CORS error
    else if (currentVideoUrl && currentVideoUrl.includes('asllmarket.org')) {
      errorMessage = 'خطای CORS: سرور asllmarket.org CORS headers تنظیم نکرده';
      shouldFallbackToExternal = true;
    }
    // Other errors
    else if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'بارگذاری ویدیو متوقف شد';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'خطا در شبکه - ممکن است فایل وجود نداشته باشد';
          shouldFallbackToExternal = true;
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'خطا در رمزگشایی ویدیو - فرمت فایل مشکل دارد';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'فرمت ویدیو پشتیبانی نمی‌شود';
          break;
        default:
          errorMessage = 'خطای ناشناخته در ویدیو';
          shouldFallbackToExternal = true;
      }
    }
    
    setVideoError(errorMessage);
    setIsLoading(false);
    
    // Automatically fall back to external link for certain errors
    if (shouldFallbackToExternal && video.video_url) {
      console.log('🎬 Falling back to external link due to error');
      setTimeout(() => {
        openExternalLink();
      }, 3000); // Give user time to read the error
    }
    
    toast({
      title: "❌ خطا در پخش ویدیو",
      description: errorMessage,
      variant: "destructive"
    });
  };

  // Convert Farsi numbers to English for time display
  const toEnglishNumber = (str: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let result = str;
    for (let i = 0; i < farsiDigits.length; i++) {
      result = result.replace(new RegExp(farsiDigits[i], 'g'), englishDigits[i]);
    }
    return result;
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      
      setCurrentTime(current);
      setDuration(total);
      setProgress(total > 0 ? (current / total) * 100 : 0);
      
      // No automatic marking as watched - user must click the button
    }
  };

  // Mark video as watched in backend
  const markVideoAsWatched = async () => {
    try {
      await apiService.markVideoAsWatched(video.id);
      onVideoWatched(video.id);
      toast({
        title: "✅ آموزش تکمیل شد",
        description: "این ویدیو به لیست آموزش‌های دیده شده اضافه شد",
      });
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Seek to specific time
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  // Full screen
  const goFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Get video source URL
  const getVideoUrl = () => {
    console.log('🎬 Getting video URL for:', video);
    console.log('🎬 Video type:', video.type);
    console.log('🎬 Video URL:', video.video_url);
    console.log('🎬 Telegram file ID:', video.telegram_file_id);
    
    if (video.type === 'link' && video.video_url) {
      console.log('🎬 Using external link:', video.video_url);
      return video.video_url;
    } else if (video.type === 'video' && video.telegram_file_id) {
      const streamUrl = `${getApiBaseUrl()}/training/video/${video.id}/stream`;
      console.log('🎬 Using streaming URL:', streamUrl);
      return streamUrl;
    }
    
    console.log('🎬 No valid video URL found');
    return '';
  };

  // Check if video can be played inline
  const canPlayInline = () => {
    const url = getVideoUrl();
    console.log('🎬 Checking if can play inline for URL:', url);
    
    // Always play inline if it's a file type (uploaded to our server)
    if (video.type === 'video') {
      console.log('🎬 Video type is file, can play inline');
      return true;
    }
    
    // For link type, check if it's a direct video file AND from our domains
    if (video.type === 'link') {
      const isDirectVideo = url.includes('.mp4') || 
             url.includes('.webm') || 
             url.includes('.ogg') ||
             url.includes('.mov') ||
             url.includes('.avi') ||
             url.includes('blob:');
      
      // Check if URL is from our domain or legacy asllmarket.org
      const currentOrigin = window.location.origin;
      const videoOrigin = new URL(url).origin;
      const isOurDomain = videoOrigin.includes(BASE_DOMAIN) || videoOrigin.includes('asllmarket.org');
      
      console.log('🎬 Link type, is direct video:', isDirectVideo);
      console.log('🎬 Current origin:', currentOrigin);
      console.log('🎬 Video origin:', videoOrigin);
      console.log('🎬 Is our domain:', isOurDomain);
      
      // Play inline if it's a direct video AND from our domains
      return isDirectVideo && isOurDomain;
    }
    
    console.log('🎬 Cannot play inline');
    return false;
  };

  // Open external link
  const openExternalLink = () => {
    if (video.video_url) {
      console.log('🎬 Opening external link:', video.video_url);
      window.open(video.video_url, '_blank');
      // External link opened but not automatically marked as watched
      // User must click the "تکمیل شد" button after watching
    }
  };

  // Try to play video inline first, fallback to external if needed
  const handleVideoPlayback = () => {
    if (canPlayInline()) {
      console.log('🎬 Attempting to play video inline');
      if (videoRef.current) {
        videoRef.current.play().catch((error) => {
          console.error('🎬 Failed to play inline, falling back to external:', error);
          setVideoError('خطا در پخش ویدیو، در حال باز کردن لینک خارجی...');
          setTimeout(() => {
            openExternalLink();
          }, 2000);
        });
      }
    } else {
      console.log('🎬 Cannot play inline, opening external link');
      openExternalLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-between">
            <span>{video.title}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {video.difficulty && (
                <Badge variant="outline" className="text-xs">
                  {video.difficulty}
                </Badge>
              )}
              {hasWatched && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  تکمیل شده
                </Badge>
              )}
            </div>
            
            {/* Manual Complete Button */}
            {!hasWatched && (
              <Button
                onClick={markVideoAsWatched}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium"
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                تکمیل شد
              </Button>
            )}
          </div>

          {/* Video Player or External Link */}
          {canPlayInline() ? (
            <Card className="bg-black rounded-lg overflow-hidden">
              <div 
                className="relative select-none" 
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                {/* Protection overlay - invisible but catches interactions */}
                <div 
                  className="absolute inset-0 z-5 pointer-events-none"
                  style={{ 
                    background: 'transparent',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                />

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p>در حال بارگذاری ویدیو...</p>
                    </div>
                  </div>
                )}
                
                {/* Error overlay */}
                {videoError && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <div className="text-center text-white p-6 max-w-md">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">خطا در پخش ویدیو</h3>
                      <p className="text-red-300 mb-4 text-sm leading-relaxed">{videoError}</p>
                      
                      {/* Show video URL for debugging */}
                      <div className="bg-gray-800/50 rounded p-3 mb-4 text-left">
                        <p className="text-xs text-gray-400 mb-1">URL ویدیو:</p>
                        <p className="text-xs font-mono break-all text-yellow-300">{video.video_url}</p>
                      </div>
                      
                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={() => {
                            setVideoError(null);
                            setIsLoading(true);
                            if (videoRef.current) {
                              videoRef.current.load();
                            }
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          تلاش مجدد
                        </Button>
                        {video.video_url && (
                          <Button 
                            onClick={openExternalLink}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <ExternalLink className="w-4 h-4 ml-2" />
                            باز کردن لینک
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-4">
                        💡 این ویدیو در ۳ ثانیه آینده به طور خودکار در صفحه جدید باز می‌شود
                      </p>
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  src={getVideoUrl()}
                  className="w-full h-auto max-h-[60vh]"
                  onLoadStart={handleLoadStart}
                  onCanPlay={handleCanPlay}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => {
                    setIsPlaying(false);
                    // Video ended but not automatically marked as watched
                    // User must click the "تکمیل شد" button
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={handleVideoError}
                  onContextMenu={(e) => e.preventDefault()} // غیرفعال کردن راست‌کلیک
                  onDragStart={(e) => e.preventDefault()} // غیرفعال کردن drag
                  controlsList="nodownload nofullscreen noremoteplayback" // غیرفعال کردن دانلود در controls
                  disablePictureInPicture // غیرفعال کردن picture-in-picture
                  controls={false}
                  preload="metadata"
                  playsInline
                  muted={isMuted}
                  crossOrigin="anonymous"
                >
                  مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {/* Progress Bar */}
                  <div 
                    className="w-full bg-gray-600 h-1 rounded-full mb-3 cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div 
                      className="bg-orange-500 h-1 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={togglePlay}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>

                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {video.video_url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={openExternalLink}
                          className="text-white hover:bg-white/20"
                          title="باز کردن در لینک خارجی"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={goFullScreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="w-5 h-5" />
                    </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            // External Link Card
            <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <ExternalLink className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  ویدیو خارجی
                </h3>
                <p className="text-muted-foreground mb-4">
                  {video.video_url && (video.video_url.includes(BASE_DOMAIN) || video.video_url.includes('asllmarket.org'))
                    ? "این ویدیو روی سرور ما آپلود شده و باید inline پخش شود"
                    : "این ویدیو در پلتفرم خارجی میزبانی می‌شود و باید در صفحه جدید باز شود"
                  }
                </p>
                
                {video.video_url && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-muted-foreground mb-1">لینک ویدیو:</p>
                    <p className="text-xs font-mono break-all">{video.video_url}</p>
                  </div>
                )}
                
                <div className="flex gap-3 justify-center">
                <Button 
                  onClick={openExternalLink}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  مشاهده ویدیو
                </Button>
                  
                  {video.description && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "📝 توضیحات ویدیو",
                          description: video.description,
                        });
                      }}
                    >
                      <FileText className="w-4 h-4 ml-2" />
                      مشاهده توضیحات
                    </Button>
                  )}
                </div>
                
                {/* Manual Complete Button for External Links */}
                {!hasWatched && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={markVideoAsWatched}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl px-6 py-2 font-medium"
                      disabled={isLoading}
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تکمیل شد
                    </Button>
                  </div>
                )}
                
                {video.video_url && !video.video_url.includes(BASE_DOMAIN) && !video.video_url.includes('asllmarket.org') && (
                  <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      💡 نکته: اگر می‌خواهید ویدیو در همین صفحه پخش شود، لطفاً آن را روی سرور اصلی آپلود کنید.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Video Description */}
          {video.description && (
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">توضیحات</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {video.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;
