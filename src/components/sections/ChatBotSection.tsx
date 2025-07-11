
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Mic, 
  Paperclip, 
  Smile, 
  Bot,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const ChatBotSection = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "سلام! من دستیار هوشمند اصل مارکت هستم. چطور می‌تونم کمکتان کنم؟",
      sender: "bot",
      time: "الان",
      type: "welcome"
    },
    {
      id: 2,
      text: "میخوام محصولم رو به امارات بفروشم",
      sender: "user",
      time: "الان"
    },
    {
      id: 3,
      text: "عالیه! برای فروش به امارات باید چند تا مرحله رو طی کنید. اول بگید چه محصولی دارید؟",
      sender: "bot",
      time: "الان",
      type: "question"
    }
  ]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        text: newMessage,
        sender: "user" as const,
        time: "الان"
      };
      setMessages([...messages, message]);
      setNewMessage("");
      
      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: "متوجه شدم. بذارید بهتون راهنمایی کنم...",
          sender: "bot" as const,
          time: "الان",
          type: "response"
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const suggestions = [
    "محصولم چیه؟",
    "بازار امارات چطوره؟",
    "چطور شروع کنم؟",
    "هزینه چقدره؟"
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">دستیار هوشمند</h2>
              <p className="text-blue-300">پاسخ سوالات شما ۲۴ ساعته</p>
            </div>
            <div className="mr-auto">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 rounded-full">
                آنلاین
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="bg-gray-900/50 border-gray-800 rounded-3xl h-[600px] flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              گفتگو با دستیار
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              فعال
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] p-4 rounded-3xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : 'bg-gray-800/50 text-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs opacity-70">{message.time}</span>
                    {message.sender === 'user' && <CheckCircle className="w-3 h-3 opacity-70" />}
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-orange-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 border-t border-gray-700/50">
          <div className="flex gap-2 overflow-x-auto">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="rounded-full border-gray-700 text-gray-300 hover:bg-gray-800 whitespace-nowrap"
                onClick={() => setNewMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-3xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Button size="sm" variant="ghost" className="rounded-full p-2 hover:bg-gray-700">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full p-2 hover:bg-gray-700">
                  <Smile className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </div>
            
            <Button size="sm" variant="ghost" className="rounded-full p-3 hover:bg-gray-700">
              <Mic className="w-5 h-5 text-gray-400" />
            </Button>
            
            <Button
              onClick={sendMessage}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-3xl p-3"
              disabled={!newMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatBotSection;
