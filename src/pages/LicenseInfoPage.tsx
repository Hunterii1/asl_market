import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LicenseInfo } from '@/components/LicenseInfo';
import HeaderAuth from '@/components/ui/HeaderAuth';
import { ArrowRight } from 'lucide-react';

const LicenseInfoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderAuth />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-2xl"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به پلتفرم
          </Button>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            اطلاعات لایسنس
          </h1>
          <p className="text-muted-foreground">
            مشاهده وضعیت و جزئیات لایسنس فعال شما
          </p>
        </div>

        {/* License Info Component */}
        <LicenseInfo />
      </div>
    </div>
  );
};

export default LicenseInfoPage;