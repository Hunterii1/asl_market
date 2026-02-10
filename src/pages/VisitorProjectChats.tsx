import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HeaderAuth from "@/components/ui/HeaderAuth";
import {
  MessageCircle,
  Send,
  Users,
  Building,
  Package,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Chat {
  id: number;
  visitor_project_id: number;
  visitor_id: number;
  supplier_id: number;
  status: string;
  last_message_at?: string;
  last_message_preview?: string;
  created_at: string;
  visitor: {
    id: number;
    full_name: string;
  };
  supplier: {
    id: number;
    full_name: string;
    brand_name: string;
  };
  visitor_project: {
    id: number;
    project_title: string;
    product_name: string;
    status: string;
  };
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

const toFarsiNumber = (num: number | string) => {
  if (typeof num === "string") {
    return num.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  return num.toLocaleString("fa-IR");
};

export default function VisitorProjectChats() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId && chats.length > 0) {
      const chat = chats.find((c) => c.id === parseInt(chatId));
      if (chat) {
        setSelectedChat(chat);
        loadMessages(chat.id);
      }
    }
  }, [searchParams, chats]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      const interval = setInterval(() => loadMessages(selectedChat.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getVisitorProjectChats();
      setChats(response.chats || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در بارگذاری چت‌ها",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      setLoadingMessages(true);
      const response = await apiService.getVisitorProjectChatMessages(chatId, {
        page: 1,
        per_page: 100,
      });
      setMessages(response.messages || []);
    } catch (error: any) {
      console.error("خطا در بارگذاری پیام‌ها:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      setSending(true);
      await apiService.sendVisitorProjectChatMessage(selectedChat.id, newMessage.trim());
      setNewMessage("");
      await loadMessages(selectedChat.id);
      await loadChats();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در ارسال پیام",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <HeaderAuth />
        <div className="container mx-auto px-4 py-20">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              برای مشاهده چت‌ها، لطفاً وارد شوید.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderAuth />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                چت‌های پروژه‌های ویزیتوری
              </h1>
              <p className="text-sm text-muted-foreground">
                گفتگو با تأمین‌کننده‌ها / ویزیتورها
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            بازگشت
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chats List */}
          <div className="lg:col-span-1">
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  چت‌ها ({toFarsiNumber(chats.length)})
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">چتی یافت نشد</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={cn(
                          "w-full text-right p-3 rounded-2xl border transition-all",
                          selectedChat?.id === chat.id
                            ? "bg-blue-500/20 border-blue-500/50"
                            : "bg-slate-900/40 border-slate-700/40 hover:border-blue-500/30"
                        )}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            {chat.supplier ? <Building className="w-4 h-4 text-blue-300" /> : <Users className="w-4 h-4 text-purple-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground line-clamp-1">
                              {chat.supplier?.brand_name || chat.supplier?.full_name || chat.visitor?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {chat.visitor_project?.project_title}
                            </p>
                          </div>
                        </div>
                        {chat.last_message_preview && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {chat.last_message_preview}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <Card className="bg-card/80 border-border rounded-3xl flex flex-col h-[600px]">
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">
                        {selectedChat.visitor_project?.project_title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedChat.supplier?.brand_name || selectedChat.supplier?.full_name || selectedChat.visitor?.full_name}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-xl",
                        selectedChat.visitor_project?.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-500/20 text-slate-300 border-slate-500/40"
                      )}
                    >
                      {selectedChat.visitor_project?.status === "active" ? "فعال" : "بسته شده"}
                    </Badge>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">هنوز پیامی ارسال نشده</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isMyMessage = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              isMyMessage ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl p-3",
                                isMyMessage
                                  ? "bg-blue-500/20 border border-blue-500/40"
                                  : "bg-slate-800/60 border border-slate-700/40"
                              )}
                            >
                              {!isMyMessage && (
                                <p className="text-xs font-semibold text-blue-300 mb-1">
                                  {message.sender.first_name} {message.sender.last_name}
                                </p>
                              )}
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {message.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="پیام خود را بنویسید..."
                      className="flex-1 rounded-2xl"
                      disabled={sending || selectedChat.visitor_project?.status !== "active"}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending || selectedChat.visitor_project?.status !== "active"}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedChat.visitor_project?.status !== "active" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      این پروژه بسته شده است و نمی‌توانید پیام جدید ارسال کنید
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="bg-card/80 border-border rounded-3xl h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">یک چت را انتخاب کنید</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
