import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: { id: string; subject: string; userName: string } | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteTicketDialog({
  open,
  onOpenChange,
  ticket,
  onConfirm,
  isDeleting = false,
}: DeleteTicketDialogProps) {
  if (!ticket) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            حذف تیکت
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            آیا از حذف تیکت <span className="font-semibold text-foreground">#{ticket.id}</span> با موضوع{' '}
            <span className="font-semibold text-foreground">{ticket.subject}</span> متعلق به{' '}
            <span className="font-semibold text-foreground">{ticket.userName}</span> اطمینان دارید؟
            <br />
            <span className="text-destructive">این عمل غیرقابل بازگشت است.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال حذف...
              </>
            ) : (
              'حذف تیکت'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

