
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowUpRight,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Wrench,
  BookOpen,
  Globe,
  Zap,
  Star,
  Settings
} from "lucide-react";
import DashboardSection from "@/components/sections/DashboardSection";
import StepsSection from "@/components/sections/StepsSection";
import ToolsSection from "@/components/sections/ToolsSection";
import ChatBotSection from "@/components/sections/ChatBotSection";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  // Convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
  };

  const menuItems = [
    { id: "dashboard", label: "داشبورد", icon: BarChart3 },
    { id: "steps", label: "مراحل", icon: BookOpen },
    { id: "tools", label: "ابزارها", icon: Wrench },
    { id: "chatbot", label: "چت بات", icon: MessageSquare },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "steps":
        return <StepsSection />;
      case "tools":
        return <ToolsSection />;
      case "chatbot":
        return <ChatBotSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Header */}
      <HeaderAuth />
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-3xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full">کل</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{toFarsiNumber(7)}</div>
              <p className="text-sm text-gray-400">مخاطبین شبکه</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-3xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-400" />
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 rounded-full">VIP</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{toFarsiNumber(2)}</div>
              <p className="text-sm text-gray-400">مخاطبین VIP</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500/20 rounded-3xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 rounded-full">اقدام</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{toFarsiNumber(4)}</div>
              <p className="text-sm text-gray-400">نیاز به توجه فوری</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-3xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 rounded-full">فرصت</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{toFarsiNumber(0)}</div>
              <p className="text-sm text-gray-400">فرصت‌های رشد</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Menu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                className={`h-16 flex flex-col gap-2 rounded-3xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "border-gray-700/50 bg-gray-900/30 hover:bg-gray-800/50 hover:border-orange-500/50 text-gray-300 hover:shadow-lg"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Dynamic Content */}
        <div className="animate-fade-in">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default Index;
