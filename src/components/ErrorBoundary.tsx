import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { errorHandler } from '@/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // ارسال خطا به error handler
    errorHandler.handleApiError(error, 'خطای غیرمنتظره در برنامه');
  }

  private handleRefresh = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // رفرش کردن صفحه
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // رفتن به صفحه اصلی
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // اگر fallback کامپوننت ارائه شده باشد
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI پیش‌فرض برای خطا
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">مشکلی پیش آمده!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  متأسفانه خطای غیرمنتظره‌ای در برنامه رخ داده است. لطفا صفحه را تازه کنید یا دوباره تلاش کنید.
                </AlertDescription>
              </Alert>

              {/* نمایش جزئیات خطا در محیط development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-md text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    جزئیات خطا (Development)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 overflow-auto">{this.state.error.toString()}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 overflow-auto">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRefresh}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  تازه کردن صفحه
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  صفحه اصلی
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook برای استفاده در functional components
export const useErrorHandler = () => {
  const handleError = (error: any, fallbackMessage?: string) => {
    return errorHandler.handleApiError(error, fallbackMessage);
  };

  const handleSuccess = (message: string) => {
    return errorHandler.showSuccess(message);
  };

  const handleWarning = (message: string) => {
    return errorHandler.showWarning(message);
  };

  const handleInfo = (message: string) => {
    return errorHandler.showInfo(message);
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    handleLicenseError: errorHandler.handleLicenseError.bind(errorHandler),
    handleAuthError: errorHandler.handleAuthError.bind(errorHandler),
  };
};

export default ErrorBoundary;