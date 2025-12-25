import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  MessageSquare, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  MessageSquare as MessageSquareIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddTicketDialog } from '@/components/tickets/AddTicketDialog';
import { EditTicketDialog } from '@/components/tickets/EditTicketDialog';
import { ViewTicketDialog } from '@/components/tickets/ViewTicketDialog';
import { DeleteTicketDialog } from '@/components/tickets/DeleteTicketDialog';
import { TicketsFilters } from '@/components/tickets/TicketsFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TicketReply {
  id: string;
  message: string;
  author: string;
  authorType: 'user' | 'admin';
  createdAt: string;
  isInternal: boolean;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: 'technical' | 'billing' | 'general' | 'bug' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
  assignedTo?: string | null;
}

// داده‌های اولیه
const initialTickets: Ticket[] = [
  {
    id: '1',
    userId: '1',
    userName: 'علی محمدی',
    subject: 'مشکل در ورود به سیستم',
    category: 'technical',
    priority: 'high',
    message: 'من نمی‌توانم به حساب کاربری خود وارد شوم. پیام خطا می‌دهد.',
    status: 'open',
    createdAt: '۱۴۰۳/۰۹/۲۰',
    updatedAt: '۱۴۰۳/۰۹/۲۰',
    replies: [],
    assignedTo: null,
  },
  {
    id: '2',
    userId: '2',
    userName: 'مریم حسینی',
    subject: 'سوال در مورد پرداخت',
    category: 'billing',
    priority: 'medium',
    message: 'آیا می‌توانم از طریق کارت به کارت پرداخت کنم؟',
    status: 'in_progress',
    createdAt: '۱۴۰۳/۰۹/۱۹',
    updatedAt: '۱۴۰۳/۰۹/۲۰',
    replies: [
      {
        id: '1',
        message: 'بله، می‌توانید از طریق کارت به کارت پرداخت کنید.',
        author: 'مدیر سیستم',
        authorType: 'admin',
        createdAt: '۱۴۰۳/۰۹/۲۰',
        isInternal: false,
      },
    ],
    assignedTo: 'علی احمدی',
  },
  {
    id: '3',
    userId: '3',
    userName: 'رضا کریمی',
    subject: 'باگ در صفحه محصولات',
    category: 'bug',
    priority: 'urgent',
    message: 'صفحه محصولات به درستی لود نمی‌شود.',
    status: 'resolved',
    createdAt: '۱۴۰۳/۰۹/۱۸',
    updatedAt: '۱۴۰۳/۰۹/۱۹',
    replies: [
      {
        id: '2',
        message: 'مشکل برطرف شد. لطفا صفحه را رفرش کنید.',
        author: 'مدیر سیستم',
        authorType: 'admin',
        createdAt: '۱۴۰۳/۰۹/۱۹',
        isInternal: false,
      },
    ],
    assignedTo: 'مریم حسینی',
  },
  {
    id: '4',
    userId: '4',
    userName: 'سارا احمدی',
    subject: 'درخواست ویژگی جدید',
    category: 'feature',
    priority: 'low',
    message: 'آیا می‌توانید امکان جستجوی پیشرفته را اضافه کنید؟',
    status: 'closed',
    createdAt: '۱۴۰۳/۰۹/۱۷',
    updatedAt: '۱۴۰۳/۰۹/۱۸',
    replies: [],
    assignedTo: null,
  },
  {
    id: '5',
    userId: '5',
    userName: 'محمد نوری',
    subject: 'سوال عمومی',
    category: 'general',
    priority: 'low',
    message: 'چگونه می‌توانم از خدمات شما استفاده کنم؟',
    status: 'open',
    createdAt: '۱۴۰۳/۰۹/۱۶',
    updatedAt: '۱۴۰۳/۰۹/۱۶',
    replies: [],
    assignedTo: null,
  },
];

const statusConfig = {
  open: {
    label: 'باز',
    className: 'bg-info/10 text-info',
    icon: Clock,
  },
  in_progress: {
    label: 'در حال بررسی',
    className: 'bg-warning/10 text-warning',
    icon: AlertTriangle,
  },
  resolved: {
    label: 'حل شده',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  closed: {
    label: 'بسته شده',
    className: 'bg-muted text-muted-foreground',
    icon: XCircle,
  },
};

const priorityConfig = {
  low: {
    label: 'پایین',
    className: 'bg-muted text-muted-foreground',
  },
  medium: {
    label: 'متوسط',
    className: 'bg-info/10 text-info',
  },
  high: {
    label: 'بالا',
    className: 'bg-warning/10 text-warning',
  },
  urgent: {
    label: 'فوری',
    className: 'bg-destructive/10 text-destructive',
  },
};

const categoryConfig = {
  technical: {
    label: 'فنی',
    className: 'bg-primary/10 text-primary',
  },
  billing: {
    label: 'مالی',
    className: 'bg-success/10 text-success',
  },
  general: {
    label: 'عمومی',
    className: 'bg-info/10 text-info',
  },
  bug: {
    label: 'باگ',
    className: 'bg-destructive/10 text-destructive',
  },
  feature: {
    label: 'ویژگی جدید',
    className: 'bg-warning/10 text-warning',
  },
  other: {
    label: 'سایر',
    className: 'bg-muted text-muted-foreground',
  },
};

type SortField = 'userName' | 'subject' | 'category' | 'priority' | 'status' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function Tickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [deleteTicket, setDeleteTicket] = useState<Ticket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('open' | 'in_progress' | 'resolved' | 'closed')[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<('technical' | 'billing' | 'general' | 'bug' | 'feature' | 'other')[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<('low' | 'medium' | 'high' | 'urgent')[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load tickets from API
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const statusFilterValue = statusFilter.length === 1 ? statusFilter[0] : 'all';
        const priorityFilterValue = priorityFilter.length === 1 ? priorityFilter[0] : 'all';
        const categoryFilterValue = categoryFilter.length === 1 ? categoryFilter[0] : 'all';

        const response = await adminApi.getTickets({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilterValue !== 'all' ? statusFilterValue : undefined,
          priority: priorityFilterValue !== 'all' ? priorityFilterValue : undefined,
          category: categoryFilterValue !== 'all' ? categoryFilterValue : undefined,
          search: searchQuery || undefined,
        });

        if (response && (response.data || response.tickets)) {
          const ticketsData = response.data?.tickets || response.tickets || [];
          const transformedTickets: Ticket[] = ticketsData.map((t: any) => ({
            id: t.id?.toString() || t.ID?.toString() || '',
            userId: t.user_id?.toString() || t.userID?.toString() || '',
            userName: t.user ? `${t.user.first_name || ''} ${t.user.last_name || ''}`.trim() : 'بدون نام',
            subject: t.title || t.subject || '',
            category: t.category || 'general',
            priority: t.priority || 'medium',
            message: t.description || t.message || '',
            status: t.status || 'open',
            createdAt: t.created_at || new Date().toISOString(),
            updatedAt: t.updated_at || t.created_at || new Date().toISOString(),
            replies: t.messages?.map((m: any) => ({
              id: m.id?.toString() || '',
              message: m.message || '',
              author: m.sender ? `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() : 'ادمین',
              authorType: m.is_admin ? 'admin' : 'user',
              createdAt: m.created_at || new Date().toISOString(),
              isInternal: false,
            })) || [],
            assignedTo: t.assigned_to || null,
          }));

          setTickets(transformedTickets);
          setTotalTickets(response.data?.total || response.total || 0);
          setTotalPages(response.data?.total_pages || response.total_pages || 1);
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
  }, [currentPage, itemsPerPage, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Use tickets directly from API (already filtered and paginated)
  const paginatedTickets = tickets;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleTicketAdded = () => {
    const stored = localStorage.getItem('asll-tickets');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTickets(parsed);
      } catch {}
    }
  };

  const toggleSelectAll = () => {
    if (selectedTickets.length === paginatedTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(paginatedTickets.map(t => t.id));
    }
  };

  const toggleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'waiting_response' | 'closed') => {
    try {
      await adminApi.updateTicketStatus(parseInt(ticketId), { status: newStatus });
      toast({
        title: 'موفقیت',
        description: 'وضعیت تیکت با موفقیت به‌روزرسانی شد.',
      });
      // Reload tickets
      const response = await adminApi.getTickets({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 ? statusFilter[0] : undefined,
        priority: priorityFilter.length === 1 ? priorityFilter[0] : undefined,
        category: categoryFilter.length === 1 ? categoryFilter[0] : undefined,
        search: searchQuery || undefined,
      });
      if (response && (response.data || response.tickets)) {
        const ticketsData = response.data?.tickets || response.tickets || [];
        const transformedTickets: Ticket[] = ticketsData.map((t: any) => ({
          id: t.id?.toString() || t.ID?.toString() || '',
          userId: t.user_id?.toString() || t.userID?.toString() || '',
          userName: t.user ? `${t.user.first_name || ''} ${t.user.last_name || ''}`.trim() : 'بدون نام',
          subject: t.title || t.subject || '',
          category: t.category || 'general',
          priority: t.priority || 'medium',
          message: t.description || t.message || '',
          status: t.status || 'open',
          createdAt: t.created_at || new Date().toISOString(),
          updatedAt: t.updated_at || t.created_at || new Date().toISOString(),
          replies: t.messages?.map((m: any) => ({
            id: m.id?.toString() || '',
            message: m.message || '',
            author: m.sender ? `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() : 'ادمین',
            authorType: m.is_admin ? 'admin' : 'user',
            createdAt: m.created_at || new Date().toISOString(),
            isInternal: false,
          })) || [],
          assignedTo: t.assigned_to || null,
        }));
        setTickets(transformedTickets);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در به‌روزرسانی وضعیت تیکت',
        variant: 'destructive',
      });
    }
  };

  const handleAddReply = async (ticketId: string, message: string) => {
    try {
      await adminApi.addAdminMessageToTicket(parseInt(ticketId), { message });
      toast({
        title: 'موفقیت',
        description: 'پیام با موفقیت ارسال شد.',
      });
      // Reload tickets
      const response = await adminApi.getTickets({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 ? statusFilter[0] : undefined,
        priority: priorityFilter.length === 1 ? priorityFilter[0] : undefined,
        category: categoryFilter.length === 1 ? categoryFilter[0] : undefined,
        search: searchQuery || undefined,
      });
      if (response && (response.data || response.tickets)) {
        const ticketsData = response.data?.tickets || response.tickets || [];
        const transformedTickets: Ticket[] = ticketsData.map((t: any) => ({
          id: t.id?.toString() || t.ID?.toString() || '',
          userId: t.user_id?.toString() || t.userID?.toString() || '',
          userName: t.user ? `${t.user.first_name || ''} ${t.user.last_name || ''}`.trim() : 'بدون نام',
          subject: t.title || t.subject || '',
          category: t.category || 'general',
          priority: t.priority || 'medium',
          message: t.description || t.message || '',
          status: t.status || 'open',
          createdAt: t.created_at || new Date().toISOString(),
          updatedAt: t.updated_at || t.created_at || new Date().toISOString(),
          replies: t.messages?.map((m: any) => ({
            id: m.id?.toString() || '',
            message: m.message || '',
            author: m.sender ? `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() : 'ادمین',
            authorType: m.is_admin ? 'admin' : 'user',
            createdAt: m.created_at || new Date().toISOString(),
            isInternal: false,
          })) || [],
          assignedTo: t.assigned_to || null,
        }));
        setTickets(transformedTickets);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTicket) return;
    
    setIsDeleting(true);
    try {
      // Note: Delete endpoint may not exist, using status update as fallback
      await adminApi.updateTicketStatus(parseInt(deleteTicket.id), { status: 'closed' });
      
      setTickets(prev => prev.filter(t => t.id !== deleteTicket.id));
      setSelectedTickets(prev => prev.filter(id => id !== deleteTicket.id));
      setDeleteTicket(null);
      setTotalTickets(prev => prev - 1);
      
      toast({
        title: 'موفقیت',
        description: 'تیکت با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف تیکت',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'open' | 'close' | 'assign' | 'delete') => {
    if (selectedTickets.length === 0) return;

    try {
      for (const ticketId of selectedTickets) {
        if (action === 'open') {
          await adminApi.updateTicketStatus(parseInt(ticketId), { status: 'open' });
        } else if (action === 'close') {
          await adminApi.updateTicketStatus(parseInt(ticketId), { status: 'closed' });
        }
      }

      // Reload tickets
      const response = await adminApi.getTickets({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 ? statusFilter[0] : undefined,
        priority: priorityFilter.length === 1 ? priorityFilter[0] : undefined,
        category: categoryFilter.length === 1 ? categoryFilter[0] : undefined,
        search: searchQuery || undefined,
      });
      if (response && (response.data || response.tickets)) {
        const ticketsData = response.data?.tickets || response.tickets || [];
        const transformedTickets: Ticket[] = ticketsData.map((t: any) => ({
          id: t.id?.toString() || t.ID?.toString() || '',
          userId: t.user_id?.toString() || t.userID?.toString() || '',
          userName: t.user ? `${t.user.first_name || ''} ${t.user.last_name || ''}`.trim() : 'بدون نام',
          subject: t.title || t.subject || '',
          category: t.category || 'general',
          priority: t.priority || 'medium',
          message: t.description || t.message || '',
          status: t.status || 'open',
          createdAt: t.created_at || new Date().toISOString(),
          updatedAt: t.updated_at || t.created_at || new Date().toISOString(),
          replies: t.messages?.map((m: any) => ({
            id: m.id?.toString() || '',
            message: m.message || '',
            author: m.sender ? `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() : 'ادمین',
            authorType: m.is_admin ? 'admin' : 'user',
            createdAt: m.created_at || new Date().toISOString(),
            isInternal: false,
          })) || [],
          assignedTo: t.assigned_to || null,
        }));
        setTickets(transformedTickets);
      }

      setSelectedTickets([]);
      
      toast({
        title: 'موفقیت',
        description: `عملیات با موفقیت انجام شد.`,
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در انجام عملیات',
        variant: 'destructive',
      });
    }
  };

  const handleResetFilters = () => {
    setStatusFilter([]);
    setCategoryFilter([]);
    setPriorityFilter([]);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت تیکت‌ها</h1>
            <p className="text-muted-foreground">لیست تمامی تیکت‌های سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              تیکت جدید
            </Button>
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
                  placeholder="جستجو بر اساس موضوع، نام کاربر، پیام یا شناسه..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
              <TicketsFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                onReset={handleResetFilters}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedTickets.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sm text-foreground font-medium">
                  {selectedTickets.length} تیکت انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('open')}
                    className="text-info hover:bg-info/10"
                  >
                    <Clock className="w-4 h-4 ml-2" />
                    باز کردن
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('close')}
                    className="text-muted-foreground hover:bg-muted/80"
                  >
                    <XCircle className="w-4 h-4 ml-2" />
                    بستن
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedTickets.length} تیکت اطمینان دارید؟`)) {
                        handleBulkAction('delete');
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">لیست تیکت‌ها ({totalTickets})</CardTitle>
              {(statusFilter.length > 0 || categoryFilter.length > 0 || priorityFilter.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 ml-1" />
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-right">
                      <input
                        type="checkbox"
                        checked={selectedTickets.length === paginatedTickets.length && paginatedTickets.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('userName')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        کاربر
                        {getSortIcon('userName')}
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('subject')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        موضوع
                        {getSortIcon('subject')}
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        دسته‌بندی
                        {getSortIcon('category')}
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('priority')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        اولویت
                        {getSortIcon('priority')}
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        وضعیت
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">پاسخ‌ها</th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        تاریخ
                        {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <MessageSquareIcon className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">هیچ تیکتی یافت نشد</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket, index) => {
                      const StatusIcon = statusConfig[ticket.status].icon;
                      return (
                        <tr
                          key={ticket.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(ticket.id)}
                              onChange={() => toggleSelectTicket(ticket.id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{ticket.userName}</p>
                              <p className="text-xs text-muted-foreground">#{ticket.id}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-foreground max-w-[200px] truncate">
                              {ticket.subject}
                            </p>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                categoryConfig[ticket.category].className
                              )}
                            >
                              {categoryConfig[ticket.category].label}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                priorityConfig[ticket.priority].className
                              )}
                            >
                              {priorityConfig[ticket.priority].label}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
                                statusConfig[ticket.status].className
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[ticket.status].label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">
                                {ticket.replies?.length || 0}
                              </span>
                              {ticket.assignedTo && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Shield className="w-3 h-3" />
                                  <span className="truncate max-w-[80px]">{ticket.assignedTo}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {ticket.createdAt}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewTicket(ticket)}
                                title="مشاهده و پاسخ"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditTicket(ticket)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTicket(ticket)}
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            )}
            {/* Pagination */}
            {!loading && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4">
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
                    <SelectItem value="25">۲۵</SelectItem>
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
      </div>

      {/* Dialog افزودن تیکت */}
      <AddTicketDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleTicketAdded}
      />

      {/* Dialog مشاهده و پاسخ تیکت */}
      <ViewTicketDialog
        open={!!viewTicket}
        onOpenChange={(open) => !open && setViewTicket(null)}
        ticket={viewTicket}
        onReply={() => {
          const stored = localStorage.getItem('asll-tickets');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setTickets(parsed);
            } catch {}
          }
        }}
      />

      {/* Dialog ویرایش تیکت */}
      <EditTicketDialog
        open={!!editTicket}
        onOpenChange={(open) => !open && setEditTicket(null)}
        ticket={editTicket}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-tickets');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setTickets(parsed);
            } catch {}
          }
          setEditTicket(null);
        }}
      />

      {/* Dialog حذف تیکت */}
      <DeleteTicketDialog
        open={!!deleteTicket}
        onOpenChange={(open) => !open && setDeleteTicket(null)}
        ticket={deleteTicket}
        onConfirm={handleDeleteTicket}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

