import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  ArrowLeft,
  User,
  Package,
  Calendar,
  MessageSquare,
  RefreshCw,
  Loader2
} from "lucide-react";

interface Rating {
  id: number;
  matching_request_id: number;
  rater_id: number;
  rater_type: 'supplier' | 'visitor';
  rated_id: number;
  rated_type: 'supplier' | 'visitor';
  rating: number;
  comment: string;
  created_at: string;
  matching_request?: {
    id: number;
    product_name: string;
  };
  rater?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export default function MatchingRatings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [page]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMatchingRatingsByUser({
        page,
        per_page: 20,
      });
      
      if (response.data?.ratings) {
        if (page === 1) {
          setRatings(response.data.ratings);
        } else {
          setRatings(prev => [...prev, ...response.data.ratings]);
        }
        setHasMore(response.data.pagination?.page < response.data.pagination?.total_pages);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در دریافت امتیازها",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-4 sm:py-8">
        <Card>
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500" />
                    امتیازهای من
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    امتیازهایی که دیگران به شما داده‌اند
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(1);
                  loadRatings();
                }}
                disabled={loading}
              >
                بروزرسانی
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading && ratings.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-muted-foreground">در حال بارگذاری...</p>
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold mb-2">امتیازی یافت نشد</p>
                <p className="text-muted-foreground">
                  هنوز کسی به شما امتیاز نداده است
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card
                    key={rating.id}
                    className="hover:shadow-lg transition-all duration-300 border-yellow-200 dark:border-yellow-800"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full">
                          <Star className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">
                                  {rating.rater?.first_name} {rating.rater?.last_name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {rating.rater_type === 'supplier' ? 'تأمین‌کننده' : 'ویزیتور'}
                                </Badge>
                              </div>
                              {rating.matching_request && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <Package className="w-3 h-3" />
                                  <span>{rating.matching_request.product_name}</span>
                                </div>
                              )}
                              <div className="mb-3">
                                {renderStars(rating.rating)}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(rating.created_at)}
                            </div>
                          </div>
                          {rating.comment && (
                            <div className="p-3 bg-muted/50 rounded-lg mt-3">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm">{rating.comment}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          در حال بارگذاری...
                        </>
                      ) : (
                        'بارگذاری بیشتر'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

