import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogIn, UserPlus, Lock } from "lucide-react";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

const AuthRequiredModal = ({ isOpen, onClose, featureName }: AuthRequiredModalProps) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate("/login");
  };

  const handleSignup = () => {
    onClose();
    navigate("/signup");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-background border-border rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-md mx-3 sm:mx-0" dir="rtl">
        <AlertDialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-400" />
          </div>
          <AlertDialogTitle className="text-foreground text-xl">
            نیاز به حساب کاربری
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-center">
            برای استفاده از <span className="text-orange-400 font-medium">"{featureName}"</span> باید حساب کاربری داشته باشید.
            <br />
            <br />
            لطفاً وارد حساب خود شوید یا حساب جدید ایجاد کنید.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-3 sm:flex-col">
          <AlertDialogAction asChild>
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl"
            >
              <LogIn className="w-4 h-4 ml-2" />
              ورود به حساب کاربری
            </Button>
          </AlertDialogAction>
          <AlertDialogAction asChild>
            <Button 
              onClick={handleSignup}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted rounded-2xl"
            >
              <UserPlus className="w-4 h-4 ml-2" />
              ساخت حساب جدید
            </Button>
          </AlertDialogAction>
          <AlertDialogCancel asChild>
            <Button 
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground rounded-2xl"
            >
              انصراف
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AuthRequiredModal; 