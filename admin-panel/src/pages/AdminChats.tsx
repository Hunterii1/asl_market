import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageCircle,
  Eye,
  Users,
  Building,
  Package,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api/adminApi";

const toFarsiNumber = (num: number | string) => {
  if (typeof num === "string") {
    return num.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  return num.toLocaleString("fa-IR");
};

interface MatchingChat {
  id: number;
  matching_request: {
    id: number;
    product_name: string;
    status: string;
  };
  supplier: {
    id: number;
    full_name: string;
    brand_name: string;
  };
  visitor: {
    id: number;
    full_name: string;
  };
  status: string;
  last_message_at?: string;
  last_message_preview?: string;
  created_at: string;
}

interface VisitorProjectChat {
  id: number;
  visitor_project: {
    id: number;
    project_title: string;
    status: string;
  };
  supplier: {
    id: number;
    full_name: string;
    brand_name: string;
  };
  visitor: {
    id: number;
    full_name: string;
  };
  status: string;
  last_message_at?: string;
  last_message_preview?: string;
  created_at: string;
}

interface Message {
  id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  image_url?: string;
  created_at: string;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export default function AdminChats() {
  const [matchingChats, setMatchingChats] = useState<MatchingChat[]>([]);
  const [visitorProjectChats, setVisitorProjectChats] = useState<VisitorProjectChat[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadMatchingChats();
    loadVisitorProjectChats();
  }, [page]);

  const loadMatchingChats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMatchingChats({ page, limit: 20 });
      setMatchingChats(data.data || data.chats || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: "خطا در بارگذاری چت‌های مچینگ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVisitorProjectChats = async () => {
    try {
      const data = await adminApi.getVisitorProjectChats({ page, limit: 20 });
      setVisitorProjectChats(data.data || data.chats || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: "خطا در بارگذاری چت‌های پروژه‌ها",
        variant: "destructive",
      });
    }
  };

  const viewMatchingChatMessages = async (chatId: number, productName: string) => {
    try {
      const data = await adminApi.getMatchingChatMessages(chatId, { per_page: 100 });
      setSelectedMessages(data.messages || data.data || []);
      setDialogTitle(`پیام‌های چت - ${productName}`);
      setMessagesDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: "خطا در بارگذاری پیام‌ها",
        variant: "destructive",
      });
    }
  };

  const viewVisitorProjectChatMessages = async (chatId: number, projectTitle: string) => {
    try {
      const data = await adminApi.getVisitorProjectChatMessages(chatId, { per_page: 100 });
      setSelectedMessages(data.messages || data.data || []);
      setDialogTitle(`پیام‌های پروژه - ${projectTitle}`);
      setMessagesDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: "خطا در بارگذاری پیام‌ها",
        variant: "destructive",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("fa-IR");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">مدیریت چت‌ها</h1>
        <p className="text-muted-foreground">مشاهده تمام چت‌های مچینگ و پروژه‌های ویزیتوری</p>
      </div>

      <Tabs defaultValue="matching" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matching">
            <MessageCircle className="w-4 h-4 ml-2" />
            چت‌های مچینگ ({toFarsiNumber(matchingChats.length)})
          </TabsTrigger>
          <TabsTrigger value="visitor-projects">
            <Package className="w-4 h-4 ml-2" />
            چت‌های پروژه‌ها ({toFarsiNumber(visitorProjectChats.length)})
          </TabsTrigger>
        </TabsList>

        {/* Matching Chats */}
        <TabsContent value="matching">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : matchingChats.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">چتی یافت نشد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 mt-4">
              {matchingChats.map((chat) => (
                <Card key={chat.id} className="hover:border-blue-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {chat.matching_request?.product_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          تأمین‌کننده: {chat.supplier?.brand_name || chat.supplier?.full_name} | ویزیتور:{" "}
                          {chat.visitor?.full_name}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          chat.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-500/20 text-slate-300"
                        }
                      >
                        {chat.status === "active" ? "فعال" : "بسته شده"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chat.last_message_preview && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        آخرین پیام: {chat.last_message_preview}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        viewMatchingChatMessages(
                          chat.id,
                          chat.matching_request?.product_name || "چت"
                        )
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      مشاهده پیام‌ها
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Visitor Project Chats */}
        <TabsContent value="visitor-projects">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
          ) : visitorProjectChats.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">چتی یافت نشد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 mt-4">
              {visitorProjectChats.map((chat) => (
                <Card key={chat.id} className="hover:border-purple-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {chat.visitor_project?.project_title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          تأمین‌کننده: {chat.supplier?.brand_name || chat.supplier?.full_name} | ویزیتور:{" "}
                          {chat.visitor?.full_name}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          chat.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-500/20 text-slate-300"
                        }
                      >
                        {chat.status === "active" ? "فعال" : "بسته شده"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chat.last_message_preview && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        آخرین پیام: {chat.last_message_preview}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        viewVisitorProjectChatMessages(
                          chat.id,
                          chat.visitor_project?.project_title || "پروژه"
                        )
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      مشاهده پیام‌ها
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Messages Dialog */}
      <Dialog open={messagesDialogOpen} onOpenChange={setMessagesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">پیامی یافت نشد</p>
            ) : (
              selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-3 bg-slate-900/40 rounded-2xl border border-slate-700/40"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-blue-300">
                      {message.sender.first_name} {message.sender.last_name} ({message.sender_type})
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(message.created_at)}</p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{message.message}</p>
                  {message.image_url && (
                    <img
                      src={message.image_url}
                      alt="attachment"
                      className="mt-2 max-w-xs rounded-lg"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
