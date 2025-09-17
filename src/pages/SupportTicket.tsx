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
  const [filterStatus, setFilterStatus] = useState("");
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
        status: filterStatus || undefined
      });
      
      if (response.success) {
        setTickets(response.data.tickets);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">در حال بارگذاری تیکت‌ها...</p>
        </div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="space-y-6 animate-fade-in">
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
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-100/40 to-blue-200/40 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/70 dark:border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-200/40 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">پشتیبانی</h2>
                <p className="text-blue-600 dark:text-blue-300">تیکت‌های پشتیبانی و ارتباط با تیم فنی</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              تیکت جدید
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ایجاد تیکت جدید</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(false)}
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
                <SelectItem value="">همه وضعیت‌ها</SelectItem>
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
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">تیکتی یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              هنوز هیچ تیکت پشتیبانی ایجاد نکرده‌اید
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              اولین تیکت را ایجاد کنید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadTicket(ticket.id)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">#{ticket.id} - {ticket.title}</h3>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {getPriorityText(ticket.priority)}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusText(ticket.status)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(ticket.created_at)}
                      </span>
                      <span>{getCategoryText(ticket.category)}</span>
                      <span>{ticket.messages.length} پیام</span>
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-muted-foreground" />
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
  );
};

export default SupportTicket;
