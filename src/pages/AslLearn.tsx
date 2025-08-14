import { useState, useEffect } from "react";
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import VideoPlayer from "@/components/VideoPlayer";
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
  Monitor,
  Package,
  ShoppingCart,
  GraduationCap,
  ArrowRight,
  Video,
  FileText,
  Award,
  Eye
} from "lucide-react";
import { LicenseGate } from '@/components/LicenseGate';

const AslLearn = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [realVideos, setRealVideos] = useState<any[]>([]);
  const [realCategories, setRealCategories] = useState<any[]>([]);
  const [watchedVideoIds, setWatchedVideoIds] = useState<number[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

  // Load real training data on component mount
  useEffect(() => {
    const loadTrainingData = async () => {
      try {
        const [categoriesRes, videosRes, watchedRes] = await Promise.all([
          apiService.getTrainingCategories(),
          apiService.getAllTrainingVideos(),
          apiService.getWatchedVideos().catch(() => ({ data: [] })) // Don't fail if watched videos can't be loaded
        ]);
        
        // Safely set data with fallbacks
        const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];
        const videos = Array.isArray(videosRes?.data) ? videosRes.data : [];
        const watchedVideos = Array.isArray(watchedRes?.data) ? watchedRes.data : [];
        
        setRealCategories(categories);
        setRealVideos(videos);
        
        // Extract watched video IDs
        const watchedIds = watchedVideos.map((watch: any) => 
          watch.VideoID || watch.video_id || watch.video?.id || watch.video?.ID
        ).filter(Boolean);
        setWatchedVideoIds(watchedIds);
        
        // Set first category as default
        if (categories.length > 0) {
          const firstCategory = categories.find(cat => cat && (cat.ID || cat.id));
          if (firstCategory) {
            const categoryId = firstCategory.ID || firstCategory.id;
            setSelectedCategory(String(categoryId));
          }
        }
        
        console.log('📚 Training data loaded:', {
          categories: categories.length,
          videos: videos.length,
          watchedVideos: watchedIds.length,
          categoriesData: categories,
          videosData: videos,
          watchedIds: watchedIds
        });
      } catch (error) {
        console.error('❌ Error loading training data:', error);
        // Set empty arrays as fallback
        setRealCategories([]);
        setRealVideos([]);
        setWatchedVideoIds([]);
      }
    };

    loadTrainingData();
  }, []);

  // Convert backend color name to Tailwind classes
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'green': 'bg-green-500/20 text-green-400 border-green-500/30',
      'red': 'bg-red-500/20 text-red-400 border-red-500/30',
      'yellow': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'purple': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'orange': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'pink': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'cyan': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'teal': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      'indigo': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'rose': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      'emerald': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'amber': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'lime': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
      'violet': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      'sky': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      'slate': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      'gray': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colorMap[colorName] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Convert backend icon emoji to Lucide icon
  const getIconComponent = (iconEmoji: string) => {
    const iconMap: Record<string, any> = {
      '📚': BookOpen, '🎓': GraduationCap, '🔬': Award, '💡': TrendingUp, 
      '🎯': ArrowRight, '🚀': TrendingUp, '⚡': Play, '🌟': Award,
      '🔥': TrendingUp, '💎': Award, '🎨': FileText, '🔧': Monitor,
      '📈': TrendingUp, '🎪': Video, '🎭': FileText, '🎸': Video,
      '🎵': Video, '🎬': Video, '📸': Video, '🔍': ArrowRight,
      '🧠': GraduationCap, '💻': Monitor, '📱': Monitor, '⌚': Clock,
    };
    return iconMap[iconEmoji] || BookOpen;
  };

  // Legacy icon mapping for backward compatibility with hardcoded categories
  const categoryIconMap = {
    "آموزش کار با پلتفرم": { 
      icon: Monitor, 
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      description: "نحوه استفاده از امکانات سایت و پنل کاربری"
    },
    "آموزش صادرات عمده": { 
      icon: Package, 
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      description: "تکنیک‌های فروش عمده و صادرات به کشورهای هدف"
    },
    "آموزش فروش تکی محصول": { 
      icon: ShoppingCart, 
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      description: "استراتژی‌های فروش خرده و بازاریابی آنلاین"
    },
    "دوره‌های آموزشی فروش": { 
      icon: GraduationCap, 
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      description: "آموزش‌های تخصصی مذاکره، بازاریابی و فروش"
    }
  };

  // Group real videos by category first
  const groupedVideos = realVideos
    .filter(video => video && (video.CategoryID || video.category_id || video.category?.id)) // Filter valid videos
    .reduce((acc, video) => {
      const categoryId = video.CategoryID || video.category_id || video.category?.id;
      if (categoryId && !acc[categoryId]) acc[categoryId] = [];
      if (categoryId) acc[categoryId].push(video);
      return acc;
    }, {});

  // Convert real categories from API to frontend format with real video counts
  const trainingCategories = realCategories
    .filter(category => category && (category.ID || category.id) && (category.Name || category.name)) // Filter out invalid categories
    .map(category => {
      const categoryId = category.ID || category.id;
      const categoryName = category.Name || category.name;
      const backendIcon = category.Icon || category.icon;
      const backendColor = category.Color || category.color;
      
      return {
        id: String(categoryId), // Safe string conversion
        name: categoryName,
        count: groupedVideos[categoryId] ? groupedVideos[categoryId].length : 0,
        // Use backend data first, then fallback to legacy mapping
        icon: backendIcon ? getIconComponent(backendIcon) : (categoryIconMap[categoryName]?.icon || BookOpen),
        color: backendColor ? getColorClasses(backendColor) : (categoryIconMap[categoryName]?.color || "bg-gray-500/20 text-gray-400 border-gray-500/30"),
        description: (() => {
          const desc = category.Description || category.description || categoryIconMap[categoryName]?.description || "";
          // Don't show generic admin-created description
          return desc === "دسته‌بندی ایجاد شده توسط ادمین" ? "" : desc;
        })()
      };
    });

  console.log('🔍 Debug groupedVideos:', groupedVideos);
  console.log('🔍 Debug realVideos:', realVideos);
  console.log('🔍 Debug realCategories:', realCategories);
  console.log('🔍 Debug trainingCategories after mapping:', trainingCategories);
  console.log('🔍 Debug selectedCategory:', selectedCategory);





  // Convert videos to frontend format
  const formatVideo = (video) => {
    const videoId = video.ID || video.id;
    const videoTitle = video.Title || video.title;
    const videoDuration = video.Duration || video.duration;
    const videoDifficulty = video.Difficulty || video.difficulty;
    const videoType = video.VideoType || video.video_type;
    const videoDescription = video.Description || video.description;
    const videoViews = video.Views || video.views;
    const videoUrl = video.VideoURL || video.video_url;
    const telegramFileId = video.TelegramFileID || video.telegram_file_id;
    
    if (!videoId || !videoTitle) return null;
    
    // Check if this video is watched
    const isWatched = watchedVideoIds.includes(videoId);
    
    const formattedVideo = {
      id: videoId,
      title: videoTitle,
      duration: videoDuration && typeof videoDuration === 'number' ? 
        `${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toString().padStart(2, '0')} دقیقه` : "نامشخص",
      lessons: 1,
      completed: isWatched,
      difficulty: videoDifficulty === "beginner" ? "مقدماتی" : 
                  videoDifficulty === "intermediate" ? "متوسط" : 
                  videoDifficulty === "advanced" ? "پیشرفته" : "مقدماتی",
      type: videoType === "file" ? "video" : "link",
      description: videoDescription || "",
      views: videoViews || 0,
      video_url: videoUrl || "",
      telegram_file_id: telegramFileId || ""
    };
    
    console.log('🎬 Formatted video:', formattedVideo);
    return formattedVideo;
  };

  const trainingModulesFake = {
    platform: [
      {
        id: 1,
        title: "آشنایی با پنل کاربری",
        duration: "۳۰ دقیقه",
        lessons: 5,
        completed: false,
        difficulty: "مقدماتی",
        type: "video"
      },
      {
        id: 2,
        title: "ثبت‌نام تأمین‌کننده و ویزیتور",
        duration: "۲۵ دقیقه",
        lessons: 4,
        completed: false,
        difficulty: "مقدماتی",
        type: "video"
      },
      {
        id: 3,
        title: "استفاده از محدودیت‌های روزانه",
        duration: "۲۰ دقیقه",
        lessons: 3,
        completed: false,
        difficulty: "مقدماتی",
        type: "guide"
      }
    ],
    wholesale: [
      {
        id: 4,
        title: "شناخت بازار کشورهای عربی",
        duration: "۴۵ دقیقه",
        lessons: 6,
        completed: false,
        difficulty: "متوسط",
        type: "video"
      },
      {
        id: 5,
        title: "تکنیک‌های صادرات عمده",
        duration: "۶۰ دقیقه",
        lessons: 8,
        completed: false,
        difficulty: "متوسط",
        type: "course"
      },
      {
        id: 6,
        title: "مدیریت زنجیره تأمین",
        duration: "۵۰ دقیقه",
        lessons: 7,
        completed: false,
        difficulty: "پیشرفته",
        type: "video"
      }
    ],
    retail: [
      {
        id: 7,
        title: "فروش آنلاین محصولات ایرانی",
        duration: "۴۰ دقیقه",
        lessons: 6,
        completed: false,
        difficulty: "مقدماتی",
        type: "video"
      },
      {
        id: 8,
        title: "بازاریابی شبکه‌های اجتماعی",
        duration: "۵۵ دقیقه",
        lessons: 8,
        completed: false,
        difficulty: "متوسط",
        type: "course"
      },
      {
        id: 9,
        title: "مدیریت موجودی و انبار",
        duration: "۳۵ دقیقه",
        lessons: 5,
        completed: false,
        difficulty: "متوسط",
        type: "guide"
      }
    ],
    sales: [
      {
        id: 10,
        title: "مذاکره و قرارداد نویسی",
        duration: "۹۰ دقیقه",
        lessons: 12,
        completed: false,
        difficulty: "پیشرفته",
        type: "course"
      },
      {
        id: 11,
        title: "بازاریابی دیجیتال در خاورمیانه",
        duration: "۷۵ دقیقه",
        lessons: 10,
        completed: false,
        difficulty: "متوسط",
        type: "course"
      },
      {
        id: 12,
        title: "روانشناسی فروش",
        duration: "۶۵ دقیقه",
        lessons: 9,
        completed: false,
        difficulty: "متوسط",
        type: "video"
      }
    ]
  };



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "آسان": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "متوسط": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "پیشرفته": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };



  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "course": return <BookOpen className="w-4 h-4" />;
      case "guide": return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "course": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "guide": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Video player handlers
  const handlePlayVideo = (video: any) => {
    console.log('🎬 Playing video:', video);
    
    // Ensure video has all required properties
    const formattedVideo = {
      id: video.id,
      title: video.title,
      description: video.description || "",
      video_url: video.video_url || "",
      telegram_file_id: video.telegram_file_id || "",
      type: video.type || "video",
      duration: video.duration || "نامشخص",
      views: video.views || 0,
      difficulty: video.difficulty || "مقدماتی"
    };
    
    console.log('🎬 Formatted video for player:', formattedVideo);
    setSelectedVideo(formattedVideo);
    setIsVideoPlayerOpen(true);
  };

  const handleVideoWatched = (videoId: number) => {
    // Add to watched videos
    setWatchedVideoIds(prev => [...prev.filter(id => id !== videoId), videoId]);
  };

  const handleCloseVideoPlayer = () => {
    setIsVideoPlayerOpen(false);
    setSelectedVideo(null);
  };

  // Get current modules from real data
  const selectedCategoryData = trainingCategories.find(cat => cat && cat.id === selectedCategory);
  console.log('🔍 Debug selectedCategoryData:', selectedCategoryData);
  console.log('🔍 Debug selectedCategory:', selectedCategory);
  console.log('🔍 Debug parseInt(selectedCategoryData?.id):', selectedCategoryData ? parseInt(selectedCategoryData.id) : 'no category');
  console.log('🔍 Debug groupedVideos[categoryId]:', selectedCategoryData ? groupedVideos[parseInt(selectedCategoryData.id)] : 'no videos');
  
  const currentModules = selectedCategoryData && selectedCategoryData.id ? 
    (groupedVideos[parseInt(selectedCategoryData.id)] || [])
      .filter(video => video && (video.ID || video.id) && (video.Title || video.title)) // Filter valid videos
      .map(formatVideo)
      .filter(Boolean) : []; // Remove null results from formatVideo

  console.log('🎬 Current modules for category:', currentModules);

  return (
    <LicenseGate>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-100/40 to-blue-200/40 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/70 dark:border-blue-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-200/40 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">آموزش اصل مارکت</h2>
                <p className="text-blue-600 dark:text-blue-300">آموزش جامع کار با پلتفرم و تکنیک‌های فروش</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Categories */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            دسته‌بندی آموزش‌ها
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {trainingCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id} 
                  className={`cursor-pointer transition-all hover:scale-105 rounded-3xl ${
                    selectedCategory === category.id 
                      ? "border-blue-500/50 bg-blue-500/10" 
                      : "bg-card/80 border-border hover:border-accent"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${category.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-foreground mb-1 text-sm">{category.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                    <Badge className={`${category.color} rounded-full text-xs`}>
                      {category.count} آموزش
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Current Category Training Modules */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Play className="w-6 h-6 text-blue-400" />
            {trainingCategories.find(cat => cat.id === selectedCategory)?.name || "آموزش‌ها"}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {currentModules.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-12 h-12 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">هنوز ویدیویی آپلود نشده</h4>
                <p className="text-muted-foreground mb-4">
                  در این دسته‌بندی هیچ ویدیو آموزشی وجود ندارد
                </p>
                <p className="text-sm text-muted-foreground">
                  ادمین می‌تواند از طریق ربات تلگرام ویدیو اضافه کند
                </p>
              </div>
            ) : (
              currentModules.map((module) => (
              <Card key={module.id} className="bg-card/80 border-border hover:border-accent transition-all rounded-3xl hover:shadow-lg">
                <CardContent className="p-6">
                  {/* Header with title and badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-2 text-lg">{module.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {module.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(module.type)}
                          {module.lessons} {module.type === "guide" ? "بخش" : "درس"}
                        </div>
                      </div>
                      
                      {/* Description if available */}
                      {module.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {module.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Badges column */}
                    <div className="flex flex-col gap-2">
                      <Badge className={`${getDifficultyColor(module.difficulty)} rounded-2xl text-xs px-3 py-1`}>
                        {module.difficulty}
                      </Badge>
                      <Badge className={`${getTypeColor(module.type)} rounded-2xl text-xs px-3 py-1`}>
                        {module.type === "video" ? "ویدئو" : module.type === "course" ? "دوره" : "راهنما"}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress and status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">پیشرفت</span>
                      <span className="font-medium">
                        {module.completed ? "100%" : "0%"}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          module.completed 
                            ? "bg-green-500" 
                            : "bg-blue-500"
                        }`}
                        style={{ width: module.completed ? "100%" : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Action section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {module.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Play className="w-5 h-5 text-orange-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {module.completed ? "تکمیل شده" : "شروع نشده"}
                      </span>
                    </div>
                    
                    {/* Enhanced play button */}
                    <Button 
                      size="sm" 
                      variant={module.completed ? "outline" : "default"}
                      className={`rounded-2xl px-6 py-2 transition-all duration-200 ${
                        module.completed 
                          ? "border-border text-foreground hover:bg-muted hover:scale-105" 
                          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-105 shadow-lg"
                      }`}
                      onClick={() => handlePlayVideo(module)}
                    >
                      {module.completed ? (
                        <>
                        <Eye className="w-4 h-4 ml-2" />
                          مشاهده مجدد
                        </>
                      ) : (
                        <>
                        <Play className="w-4 h-4 ml-2" />
                          شروع آموزش
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )))}
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            آمار آموزش‌ها
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-200/40 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">{realVideos.length || 0}</div>
                <p className="text-sm text-muted-foreground">مجموع آموزش‌ها</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-green-200/40 dark:bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">{realVideos.filter(v => v.video_type === 'file').length || 0}</div>
                <p className="text-sm text-muted-foreground">فایل آپلود شده</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-orange-200/40 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">{realVideos.filter(v => v.video_type === 'link').length || 0}</div>
                <p className="text-sm text-muted-foreground">لینک ویدیو</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-200/40 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">{realCategories.length || 0}</div>
                <p className="text-sm text-muted-foreground">دسته‌بندی</p>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>

    {/* Video Player Modal */}
    {selectedVideo && (
      <VideoPlayer
        video={selectedVideo}
        isOpen={isVideoPlayerOpen}
        onClose={handleCloseVideoPlayer}
        onVideoWatched={handleVideoWatched}
      />
    )}
    </LicenseGate>
  );
};

export default AslLearn;