import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  Wifi, 
  User, 
  Shield, 
  Server, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { errorHandler } from '@/utils/errorHandler';
import { apiService } from '@/services/api';

// این کامپوننت فقط برای development و تست
export function ErrorTestPanel() {
  const [isVisible, setIsVisible] = useState(false);

  // نمایش فقط در development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const testErrors = [
    {
      title: 'خطای شبکه',
      icon: Wifi,
      color: 'bg-red-500',
      action: () => {
        errorHandler.handleApiError({
          message: 'Failed to fetch'
        }, 'خطا در اتصال به سرور');
      }
    },
    {
      title: 'خطای احراز هویت',
      icon: User,
      color: 'bg-orange-500',
      action: () => {
        errorHandler.handleApiError({
          response: {
            status: 401,
            data: {
              error: 'Unauthorized',
              needs_auth: true
            }
          }
        }, 'دسترسی غیرمجاز');
      }
    },
    {
      title: 'خطای لایسنس',
      icon: Shield,
      color: 'bg-blue-500',
      action: () => {
        errorHandler.handleApiError({
          response: {
            status: 403,
            data: {
              error: 'License required',
              license_status: {
                needs_license: true,
                has_license: false,
                is_approved: false
              }
            }
          }
        }, 'نیاز به لایسنس');
      }
    },
    {
      title: 'خطای سرور',
      icon: Server,
      color: 'bg-purple-500',
      action: () => {
        errorHandler.handleApiError({
          response: {
            status: 500,
            data: {
              error: 'Internal server error'
            }
          }
        }, 'خطای داخلی سرور');
      }
    },
    {
      title: 'خطای اعتبارسنجی',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      action: () => {
        errorHandler.handleApiError({
          response: {
            status: 400,
            data: {
              error: 'Validation failed',
              details: 'اطلاعات ورودی نامعتبر است'
            }
          }
        }, 'اعتبارسنجی ناموفق');
      }
    },
    {
      title: 'پیام موفقیت',
      icon: CheckCircle,
      color: 'bg-green-500',
      action: () => {
        errorHandler.showSuccess('عملیات با موفقیت انجام شد!');
      }
    }
  ];

  const testApiCalls = [
    {
      title: 'تست API نامعتبر',
      action: async () => {
        try {
          await fetch('/api/invalid-endpoint');
        } catch (error) {
          // خطا به صورت خودکار توسط error handler مدیریت می‌شود
        }
      }
    },
    {
      title: 'تست Timeout',
      action: async () => {
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 100);
          
          await fetch('https://httpbin.org/delay/5', {
            signal: controller.signal
          });
        } catch (error) {
          errorHandler.handleApiError(error, 'خطای timeout');
        }
      }
    },
    {
      title: 'تست درخواست نامعتبر',
      action: async () => {
        try {
          await apiService.login({ email: '', password: '' });
        } catch (error) {
          // خطا به صورت خودکار مدیریت می‌شود
        }
      }
    }
  ];

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <Bug className="h-4 w-4 mr-1" />
          Error Test
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Error Test Panel
            </CardTitle>
            <Badge variant="secondary" className="text-xs">DEV</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">تست انواع خطا:</h4>
            <div className="grid grid-cols-2 gap-2">
              {testErrors.map((error, index) => {
                const Icon = error.icon;
                return (
                  <Button
                    key={index}
                    onClick={error.action}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 flex flex-col items-center gap-1"
                  >
                    <div className={`w-6 h-6 rounded-full ${error.color} flex items-center justify-center`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-center">{error.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">تست API Calls:</h4>
            <div className="space-y-1">
              {testApiCalls.map((test, index) => (
                <Button
                  key={index}
                  onClick={test.action}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  {test.title}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              onClick={() => {
                // Clear all error events
                window.dispatchEvent(new CustomEvent('clear-errors'));
              }}
              variant="ghost"
              size="sm"
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Hide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}