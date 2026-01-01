import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_response' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const statusConfig = {
  open: {
    label: 'باز',
    className: 'bg-info/10 text-info',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'در حال بررسی',
    className: 'bg-primary/10 text-primary',
    icon: Clock,
  },
  waiting_response: {
    label: 'منتظر پاسخ',
    className: 'bg-warning/10 text-warning',
    icon: Clock,
  },
  closed: {
    label: 'بسته شده',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
};

const priorityConfig = {
  low: { label: 'پایین', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'متوسط', className: 'bg-info/10 text-info' },
  high: { label: 'بالا', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'فوری', className: 'bg-destructive/10 text-destructive' },
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load tickets from API
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getTickets({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });

        if (response && (response.tickets || response.data?.tickets)) {
          // handleResponse returns data.data, so structure is { pagination: {...}, tickets: [...] }
          const ticketsData = response.tickets || response.data?.tickets || [];
          const transformedTickets: Ticket[] = ticketsData.map((t: any) => ({
            id: t.id || t.ID || 0,
            title: t.title || 'بدون عنوان',
            description: t.description || '',
            status: t.status || 'open',
            priority: t.priority || 'medium',
            category: t.category || 'general',
            user_id: t.user_id || t.user?.id || 0,
            user_name: t.user?.first_name && t.user?.last_name 
              ? `${t.user.first_name} ${t.user.last_name}` 
              : t.user?.name || 'کاربر ناشناس',
            user_email: t.user?.email || '',
            created_at: t.created_at || new Date().toISOString(),
            updated_at: t.updated_at || t.created_at || new Date().toISOString(),
            messages: t.messages || [],
          }));

          setTickets(transformedTickets);
          // Get pagination data from response.pagination (since handleResponse returns data.data)
          const pagination = response.pagination || response.data?.pagination;
          setTotalTickets(pagination?.total || response.total || 0);
          setTotalPages(pagination?.total_pages || response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading tickets:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری تیکت‌ها',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [currentPage, itemsPerPage, statusFilter]);

  // Filter tickets by search query
  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(query) ||
      ticket.description.toLowerCase().includes(query) ||
      ticket.user_name?.toLowerCase().includes(query) ||
      ticket.user_email?.toLowerCase().includes(query) ||
      ticket.id.toString().includes(query)
    );
  });

  const handleViewTicket = async (ticket: Ticket) => {
    try {
      const response = await adminApi.getTicket(ticket.id);
      if (response && (response.data || response.ticket)) {
        const ticketData = response.data?.ticket || response.ticket || response;
        const fullTicket: Ticket = {
          ...ticket,
          messages: ticketData.messages || [],
        };
        setSelectedTicket(fullTicket);
      } else {
        setSelectedTicket(ticket);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در دریافت جزئیات تیکت',
        variant: 'destructive',
      });
      setSelectedTicket(ticket);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفا پیام پاسخ را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsReplying(true);
    try {
      await adminApi.addAdminMessageToTicket(selectedTicket.id, { message: replyMessage });
      
      // Update ticket status to waiting_response
      await adminApi.updateTicketStatus(selectedTicket.id, { 
        status: 'waiting_response',
        message: replyMessage 
      });

      toast({
        title: 'موفقیت',
        description: 'پاسخ با موفقیت ارسال شد',
      });

      setReplyMessage('');
      // Reload tickets
      const response = await adminApi.getTickets({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (response && (response.tickets || response.data?.tickets)) {
        const ticketsData = response.tickets || response.data?.tickets || [];
        const transformedTickets: Ticket[] = ticketsData.map((t: any) => ({
          id: t.id || t.ID || 0,
          title: t.title || 'بدون عنوان',
          description: t.description || '',
          status: t.status || 'open',
          priority: t.priority || 'medium',
          category: t.category || 'general',
          user_id: t.user_id || t.user?.id || 0,
          user_name: t.user?.first_name && t.user?.last_name 
            ? `${t.user.first_name} ${t.user.last_name}` 
            : t.user?.name || 'کاربر ناشناس',
          user_email: t.user?.email || '',
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || t.created_at || new Date().toISOString(),
          messages: t.messages || [],
        }));
        setTickets(transformedTickets);
      }

      // Reload selected ticket
      if (selectedTicket) {
        await handleViewTicket(selectedTicket);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ارسال پاسخ',
        variant: 'destructive',
      });
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async (ticket: Ticket) => {
    try {
      await adminApi.updateTicketStatus(ticket.id, { status: 'closed' });
      toast({
        title: 'موفقیت',
        description: 'تیکت با موفقیت بسته شد',
      });
      // Reload tickets
      const response = await adminApi.getTickets({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (response && (response.tickets || response.data?.tickets)) {
        const ticketsData = response.tickets || response.data?.tickets || [];
        const transformedTickets: Ticket[] = ticketsData.map((t: any) => ({
          id: t.id || t.ID || 0,
          title: t.title || 'بدون عنوان',
          description: t.description || '',
          status: t.status || 'open',
          priority: t.priority || 'medium',
          category: t.category || 'general',
          user_id: t.user_id || t.user?.id || 0,
          user_name: t.user?.first_name && t.user?.last_name 
            ? `${t.user.first_name} ${t.user.last_name}`
            : t.user?.name || 'کاربر ناشناس',
          user_email: t.user?.email || '',
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || t.created_at || new Date().toISOString(),
          messages: t.messages || [],
        }));
        setTickets(transformedTickets);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بستن تیکت',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">تیکت‌های پشتیبانی</h1>
            <p className="text-muted-foreground">مدیریت و پاسخ‌دهی به تیکت‌های کاربران</p>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="جستجو بر اساس عنوان، محتوا، کاربر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="open">باز</SelectItem>
                  <SelectItem value="in_progress">در حال بررسی</SelectItem>
                  <SelectItem value="waiting_response">منتظر پاسخ</SelectItem>
                  <SelectItem value="closed">بسته شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست تیکت‌ها ({totalTickets})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <MessageSquare className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ تیکتی یافت نشد</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">شناسه</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عنوان</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">کاربر</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">وضعیت</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">اولویت</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">تاریخ</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const StatusIcon = statusConfig[ticket.status].icon;
                      return (
                        <tr key={ticket.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <span className="text-sm font-medium">#{ticket.id}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">{ticket.title}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {ticket.description}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{ticket.user_name}</span>
                              {ticket.user_email && (
                                <span className="text-xs text-muted-foreground">{ticket.user_email}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={cn(statusConfig[ticket.status].className)}>
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[ticket.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={priorityConfig[ticket.priority].className}>
                              {priorityConfig[ticket.priority].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString('fa-IR')}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewTicket(ticket)}
                              >
                                <MessageSquare className="w-4 h-4 ml-1" />
                                مشاهده
                              </Button>
                              {ticket.status !== 'closed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCloseTicket(ticket)}
                                  className="text-success hover:bg-success/10"
                                >
                                  <CheckCircle className="w-4 h-4 ml-1" />
                                  بستن
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredTickets.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalTickets)} از {totalTickets} تیکت
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">۱۰</SelectItem>
                      <SelectItem value="20">۲۰</SelectItem>
                      <SelectItem value="50">۵۰</SelectItem>
                      <SelectItem value="100">۱۰۰</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    قبلی
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className={currentPage === pageNum ? "gradient-primary text-primary-foreground" : ""}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    بعدی
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تیکت #{selectedTicket?.id}</DialogTitle>
              <DialogDescription>
                {selectedTicket?.title}
              </DialogDescription>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">کاربر:</span>
                    <p className="font-medium">{selectedTicket.user_name}</p>
                    {selectedTicket.user_email && (
                      <p className="text-sm text-muted-foreground">{selectedTicket.user_email}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">وضعیت:</span>
                    <div className="mt-1">
                      <Badge className={cn(statusConfig[selectedTicket.status].className)}>
                        {statusConfig[selectedTicket.status].label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">اولویت:</span>
                    <div className="mt-1">
                      <Badge className={priorityConfig[selectedTicket.priority].className}>
                        {priorityConfig[selectedTicket.priority].label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">دسته:</span>
                    <p className="font-medium">{selectedTicket.category}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium mb-2">توضیحات:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Messages */}
                {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">تاریخچه پیام‌ها:</h4>
                    <div className="space-y-3">
                      {selectedTicket.messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-3 rounded-lg",
                            message.is_admin
                              ? "bg-primary/10 border border-primary/20 mr-8"
                              : "bg-muted ml-8"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {message.is_admin ? 'پشتیبانی' : 'کاربر'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString('fa-IR')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Section */}
                {selectedTicket.status !== 'closed' && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">ارسال پاسخ:</h4>
                    <Textarea
                      placeholder="پیام پاسخ خود را وارد کنید..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedTicket && selectedTicket.status !== 'closed' && (
                <Button
                  onClick={handleReply}
                  disabled={!replyMessage.trim() || isReplying}
                >
                  {isReplying ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      ارسال پاسخ
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                بستن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

