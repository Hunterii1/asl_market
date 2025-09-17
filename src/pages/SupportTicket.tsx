import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { 
  MessageSquare, 
  Plus, 
  Send, 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Filter,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock
} from "lucide-react";
import HeaderAuth from "@/components/ui/HeaderAuth";

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: number;
  message: string;
  is_admin: boolean;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  created_at: string;
}

const SupportTicket = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Create ticket form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general"
  });

  useEffect(() => {
    loadTickets();
  }, [page, filterStatus]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSupportTickets({
        page,
        status: filterStatus === "all" ? undefined : filterStatus
      });
      
      if (response.success) {
        setTickets(response.data.tickets || []);
        setTotalPages(response.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در بارگذاری تیکت‌ها",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTicket = async (ticketId: number) => {
    try {
      const response = await apiService.getSupportTicket(ticketId);
      if (response.success) {
        setSelectedTicket(response.data);
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در بارگذاری تیکت",
      });
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفاً تمام فیلدها را پر کنید",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.createSupportTicket(createForm);
      
      if (response.success) {
        toast({
          title: "موفقیت",
          description: "تیکت با موفقیت ایجاد شد",
        });
        setShowCreateForm(false);
        setCreateForm({ title: "", description: "", priority: "medium", category: "general" });
        loadTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در ایجاد تیکت",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSubmitting(true);
      const response = await apiService.addTicketMessage(selectedTicket.id, { message: newMessage });
      
      if (response.success) {
        setNewMessage("");
        loadTicket(selectedTicket.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در ارسال پیام",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      const response = await apiService.closeSupportTicket(selectedTicket.id);
      if (response.success) {
        toast({
          title: "موفقیت",
          description: "تیکت با موفقیت بسته شد",
        });
        loadTickets();
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در بستن تیکت",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "waiting_response": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "closed": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return "باز";
      case "in_progress": return "در حال بررسی";
      case "waiting_response": return "منتظر پاسخ";
      case "closed": return "بسته";
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "low": return "کم";
      case "medium": return "متوسط";
      case "high": return "بالا";
      case "urgent": return "فوری";
      default: return priority;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "general": return "عمومی";
      case "technical": return "فنی";
      case "billing": return "مالی";
      case "license": return "لایسنس";
      case "other": return "سایر";
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen">
        <HeaderAuth />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">در حال بارگذاری تیکت‌ها...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="min-h-screen">
        <HeaderAuth />
        <div className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTicket(null)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              بازگشت
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">تیکت #{selectedTicket.id}</h1>
              <p className="text-muted-foreground">{selectedTicket.title}</p>
            </div>
          </div>
          {selectedTicket.status !== "closed" && (
            <Button
              variant="outline"
              onClick={handleCloseTicket}
              className="text-red-600 hover:text-red-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              بستن تیکت
            </Button>
          )}
        </div>

        {/* Ticket Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">اولویت</label>
                <Badge className={`mt-1 ${getPriorityColor(selectedTicket.priority)}`}>
                  {getPriorityText(selectedTicket.priority)}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">وضعیت</label>
                <Badge className={`mt-1 ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusText(selectedTicket.status)}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">دسته‌بندی</label>
                <p className="mt-1 text-sm">{getCategoryText(selectedTicket.category)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاریخ ایجاد</label>
                <p className="mt-1 text-sm">{formatDate(selectedTicket.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              مکالمه
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedTicket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_admin ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-lg ${
                      message.is_admin
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.is_admin ? (
                        <span className="text-xs font-medium">پشتیبانی</span>
                      ) : (
                        <span className="text-xs font-medium">
                          {selectedTicket.user.first_name} {selectedTicket.user.last_name}
                        </span>
                      )}
                      <span className="text-xs opacity-70">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedTicket.status !== "closed" && (
              <>
                <Separator className="my-4" />
                <div className="flex gap-2">
                  <Textarea
                    placeholder="پیام خود را بنویسید..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || submitting}
                    className="self-end"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeaderAuth />
      <div className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-100/30 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30 rounded-3xl">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <CardContent className="relative p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 dark:from-blue-100 dark:to-indigo-200 bg-clip-text text-transparent">
                    مرکز پشتیبانی اصل مارکت
                  </h1>
                  <p className="text-blue-700 dark:text-blue-300 text-lg">
                    تیم پشتیبانی ما ۲۴/۷ آماده کمک به شماست
                  </p>
                  <div className="flex items-center gap-4 text-sm text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      آنلاین
                    </span>
                    <span>پاسخگویی سریع</span>
                    <span>پشتیبانی تخصصی</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  ایجاد تیکت جدید
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl px-6 py-4"
                  onClick={() => {/* Add FAQ or help functionality */}}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  راهنما
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/30 to-blue-100/30 dark:from-blue-900/10 dark:to-blue-800/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">ایجاد تیکت جدید</h2>
                  <p className="text-sm text-muted-foreground font-normal">مشکل یا سوال خود را با ما در میان بگذارید</p>
                </div>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">عنوان تیکت</label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="عنوان مشکل یا درخواست خود را بنویسید"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">اولویت</label>
                  <Select
                    value={createForm.priority}
                    onValueChange={(value) => setCreateForm({ ...createForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">کم</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">بالا</SelectItem>
                      <SelectItem value="urgent">فوری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">دسته‌بندی</label>
                <Select
                  value={createForm.category}
                  onValueChange={(value) => setCreateForm({ ...createForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عمومی</SelectItem>
                    <SelectItem value="technical">فنی</SelectItem>
                    <SelectItem value="billing">مالی</SelectItem>
                    <SelectItem value="license">لایسنس</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">توضیحات</label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="توضیحات کامل مشکل یا درخواست خود را بنویسید"
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      در حال ایجاد...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      ایجاد تیکت
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در تیکت‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فیلتر بر اساس وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="open">باز</SelectItem>
                <SelectItem value="in_progress">در حال بررسی</SelectItem>
                <SelectItem value="waiting_response">منتظر پاسخ</SelectItem>
                <SelectItem value="closed">بسته</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
          <CardContent className="p-12 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-3xl flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-3">
              هنوز تیکتی ندارید
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-6 max-w-md mx-auto leading-relaxed">
              اولین تیکت پشتیبانی خود را ایجاد کنید و از خدمات پشتیبانی ۲۴/۷ ما بهره‌مند شوید
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5 mr-2" />
                ایجاد اولین تیکت
              </Button>
              <Button 
                variant="outline"
                className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-6 py-3 rounded-2xl"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                مشاهده راهنما
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="group hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 cursor-pointer border-l-4 hover:border-l-blue-500 hover:scale-[1.02]" 
              onClick={() => loadTicket(ticket.id)}
            >
              <CardContent className="p-5">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          #{ticket.id}
                        </div>
                        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {ticket.title}
                        </h3>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${getPriorityColor(ticket.priority)} text-xs px-2 py-1`}>
                          {getPriorityText(ticket.priority)}
                        </Badge>
                        <Badge className={`${getStatusColor(ticket.status)} text-xs px-2 py-1`}>
                          {getStatusText(ticket.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Eye className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {ticket.messages?.length || 0} پیام
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {getCategoryText(ticket.category)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground group-hover:text-blue-500 transition-colors">
                      مشاهده جزئیات
                      <ChevronLeft className="w-3 h-3 mr-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                صفحه {page} از {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  بعدی
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default SupportTicket;
