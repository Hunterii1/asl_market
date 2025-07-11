import { Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeaderAuth = () => (
  <header className="border-b border-gray-800/50 bg-gray-900/50 w-full">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">اصل مارکت</h1>
            <p className="text-sm text-gray-400">سیستم هوشمند فروش بین‌المللی</p>
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default HeaderAuth; 