import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  Clock,
  Eye,
  CheckCircle,
  X
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchThreshold = 0.8; // 80% watched counts as completion

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
      
      // Mark as watched if user has watched 80% of the video
      if (total > 0 && current / total >= watchThreshold && !hasWatched) {
        setHasWatched(true);
        markVideoAsWatched();
      }
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
    if (video.type === 'link' && video.video_url) {
      // Return the direct link (could be from any hosting provider)
      return video.video_url;
    } else if (video.type === 'video' && video.telegram_file_id) {
      // For Telegram files uploaded to our server, use streaming endpoint
      return `/api/v1/training/video/${video.id}/stream`;
    }
    return '';
  };

  // Check if video can be played inline
  const canPlayInline = () => {
    const url = getVideoUrl();
    // Always play inline if it's a file type (uploaded to our server)
    if (video.type === 'video') return true;
    
    // For link type, check if it's a direct video file
    if (video.type === 'link') {
      // Check if URL is a direct video file (any .mp4, .webm, .ogg file)
      // This includes external hosting services like file hosting providers
      return url.includes('.mp4') || 
             url.includes('.webm') || 
             url.includes('.ogg') ||
             url.includes('.mov') ||
             url.includes('.avi') ||
             url.includes('blob:');
    }
    
    return false;
  };

  // Open external link
  const openExternalLink = () => {
    if (video.video_url) {
      window.open(video.video_url, '_blank');
      // Still mark as "watched" when they click external link
      if (!hasWatched) {
        setHasWatched(true);
        markVideoAsWatched();
      }
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {video.duration || "نامشخص"}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {video.views || 0} بازدید
            </div>
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

          {/* Video Player or External Link */}
          {canPlayInline() ? (
            <Card className="bg-black rounded-lg overflow-hidden">
              <div className="relative">
                <video
                  ref={videoRef}
                  src={getVideoUrl()}
                  className="w-full h-auto max-h-[60vh]"
                  crossOrigin="anonymous"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => {
                    setIsPlaying(false);
                    if (!hasWatched) {
                      setHasWatched(true);
                      markVideoAsWatched();
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Video load error:', e);
                    // Fallback to opening external link if video fails to load
                  }}
                  poster="/placeholder-video.jpg"
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
                  این ویدیو در پلتفرم خارجی میزبانی می‌شود
                </p>
                <Button 
                  onClick={openExternalLink}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  مشاهده ویدیو
                </Button>
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
