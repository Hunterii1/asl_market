import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  ArrowLeft,
  User,
  Package,
  Clock,
  Search,
  RefreshCw,
  Loader2
} from "lucide-react";

interface Conversation {
  id: number;
  matching_request_id: number;
  supplier_id: number;
  supplier_name: string;
  visitor_id: number;
  visitor_name: string;
  is_active: boolean;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export default function MatchingChats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMatchingChatConversations({
        page: 1,
        per_page: 50,
      });
      
      if (response.data?.conversations) {
        setConversations(response.data.conversations);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در دریافت مکالمات",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "همین الان";
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    if (days < 7) return `${days} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      conv.supplier_name.toLowerCase().includes(search) ||
      conv.visitor_name.toLowerCase().includes(search) ||
      conv.last_message?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-6xl py-4 sm:py-8">
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
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
                    <MessageCircle className="w-6 h-6 text-blue-500" />
                    مکالمات Matching
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    چت‌های شما با تأمین‌کنندگان و ویزیتورها
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadConversations}
                disabled={loading}
              >
                بروزرسانی
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="جستجو در مکالمات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            {loading && conversations.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-muted-foreground">در حال بارگذاری...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold mb-2">مکالمه‌ای یافت نشد</p>
                <p className="text-muted-foreground">
                  {searchTerm ? "نتیجه‌ای برای جستجوی شما یافت نشد" : "هنوز مکالمه‌ای ندارید"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer border-blue-200 dark:border-blue-800"
                    onClick={() => navigate(`/matching/requests/${conv.matching_request_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
                          <MessageCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {conv.supplier_name} ↔️ {conv.visitor_name}
                                </h3>
                                {conv.unread_count > 0 && (
                                  <Badge className="bg-red-500">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Package className="w-3 h-3" />
                                <span>درخواست #{conv.matching_request_id}</span>
                              </div>
                            </div>
                            {conv.last_message_at && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                {formatTime(conv.last_message_at)}
                              </div>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {conv.last_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

