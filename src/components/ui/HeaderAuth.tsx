import { Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const HeaderAuth = () => (
  <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">اصل مارکت</h1>
            <p className="text-sm text-muted-foreground">سیستم هوشمند فروش بین‌المللی</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>
);

export default HeaderAuth; 