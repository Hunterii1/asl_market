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

interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: { id: string; name: string } | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteSupplierDialog({
  open,
  onOpenChange,
  supplier,
  onConfirm,
  isDeleting = false,
}: DeleteSupplierDialogProps) {
  if (!supplier) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            حذف تامین‌کننده
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            آیا از حذف تامین‌کننده <span className="font-semibold text-foreground">{supplier.name}</span> اطمینان دارید؟
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
              'حذف تامین‌کننده'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

