import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  Upload, 
  Download, 
  Send,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';

interface QuickActionsProps {
  onAddUser?: () => void;
  onImportUsers?: () => void;
  onExportUsers?: () => void;
  onSendNotification?: () => void;
  onAddProduct?: () => void;
  onGenerateReport?: () => void;
}

const actions = [
  {
    title: 'افزودن کاربر',
    icon: UserPlus,
    color: 'bg-success/10 text-success hover:bg-success/20',
    action: 'addUser' as const,
  },
  {
    title: 'واردسازی گروهی',
    icon: Upload,
    color: 'bg-info/10 text-info hover:bg-info/20',
    action: 'import' as const,
  },
  {
    title: 'خروجی اکسل',
    icon: Download,
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
    action: 'export' as const,
  },
  {
    title: 'ارسال اعلان',
    icon: Send,
    color: 'bg-warning/10 text-warning hover:bg-warning/20',
    action: 'notify' as const,
  },
  {
    title: 'محصول جدید',
    icon: Plus,
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
    action: 'addProduct' as const,
  },
  {
    title: 'گزارش‌گیری',
    icon: FileSpreadsheet,
    color: 'bg-muted text-muted-foreground hover:bg-muted/80',
    action: 'report' as const,
  },
];

export function QuickActions({ onAddUser, onImportUsers, onExportUsers, onSendNotification, onAddProduct, onGenerateReport }: QuickActionsProps) {
  const handleAction = (action: string) => {
    if (action === 'addUser' && onAddUser) {
      onAddUser();
    } else if (action === 'import' && onImportUsers) {
      onImportUsers();
    } else if (action === 'export' && onExportUsers) {
      onExportUsers();
    } else if (action === 'notify' && onSendNotification) {
      onSendNotification();
    } else if (action === 'addProduct' && onAddProduct) {
      onAddProduct();
    } else if (action === 'report' && onGenerateReport) {
      onGenerateReport();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">دسترسی سریع</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Button
              key={action.title}
              variant="ghost"
              onClick={() => handleAction(action.action)}
              className={`h-auto flex-col gap-2 p-4 rounded-2xl ${action.color} animate-scale-in transition-all duration-200`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
