import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LicenseGate } from '@/components/LicenseGate';
import { apiService, type Chat, type Message, type ChatRequest, type AIUsageResponse } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { translateSuccess } from "@/utils/errorMessages";
import { 
  Bot, 
  MessageSquare, 
  Send,
  Trash2,
  User,
  Loader2,
  Plus,
  Sparkles,

  Lock,
  LogIn,
  Menu,
  History
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AslAI = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const [displayedContent, setDisplayedContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [aiUsage, setAiUsage] = useState<AIUsageResponse | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentChatRef = useRef<Chat | null>(null);
  
  // Read search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Filter chats by search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm.trim()) return true;
    return chat.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Load chats and AI usage on component mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadChats();
      loadAIUsage();
    }
  }, [isAuthenticated, authLoading]);

  // Sync currentChat state with ref
  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  // Auto scroll to bottom when new messages arrive or typing content changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Typewriter effect function
  const startTypewriter = (content: string, messageId: number) => {
    setIsTyping(true);
    setTypingMessageId(messageId);
    setDisplayedContent("");
    setOriginalContent(content); // Store original content for skip functionality
    
    let index = 0;
    const typeSpeed = 40; // milliseconds per character (adjust for desired speed)
    
    const typeNextChar = () => {
      if (index < content.length) {
        setDisplayedContent(content.slice(0, index + 1));
        index++;
        typewriterTimeoutRef.current = setTimeout(typeNextChar, typeSpeed);
      } else {
        // When typing is complete, update the actual message content
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: content }
              : msg
          )
        );
        
        setIsTyping(false);
        setTypingMessageId(null);
        setDisplayedContent("");
        setOriginalContent("");
        setIsSending(false); // Reset sending state when typing is complete
      }
    };
    
    typeNextChar();
  };

  // Skip typewriter effect - show full content immediately
  const skipTypewriter = (messageId: number) => {
    if (isTyping && typingMessageId === messageId && originalContent) {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
      
      // Update the message with full content
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: originalContent }
            : msg
        )
      );
      
      setIsTyping(false);
      setTypingMessageId(null);
      setDisplayedContent("");
      setOriginalContent("");
      setIsSending(false); // Reset sending state when skipping typewriter
    }
  };

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getChats();
      setChats(response.chats);
    } catch (error) {
      console.error("Failed to load chats:", error);
      // Error toast is handled in api.ts
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIUsage = async () => {
    try {
      setIsUsageLoading(true);
      const usage = await apiService.getAIUsage();
      setAiUsage(usage);
    } catch (error) {
      console.error("Failed to load AI usage:", error);
      // Error toast is handled in api.ts
    } finally {
      setIsUsageLoading(false);
    }
  };

  const loadChat = async (chatId: number) => {
    try {
      // Stop any ongoing typewriter effect
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
      setIsTyping(false);
      setTypingMessageId(null);
      setDisplayedContent("");
      setOriginalContent("");
      setIsSending(false); // Reset sending state when loading chat
      
      const response = await apiService.getChat(chatId);
      setCurrentChat(response.chat);
      currentChatRef.current = response.chat;
      setMessages(response.chat.messages || []);
      setIsDrawerOpen(false); // Close drawer after selecting chat on mobile
    } catch (error) {
      console.error("Failed to load chat:", error);
      // Error toast is handled in api.ts
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending || isTyping) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    try {
      const request: ChatRequest = {
        message: messageText,
        chat_id: currentChatRef.current?.id || currentChat?.id
      };

      console.log("🔄 Sending chat request:", request, "| Current chat in state:", currentChat?.id, "| Current chat in ref:", currentChatRef.current?.id);
      const response = await apiService.sendChatMessage(request);
      console.log("✅ Chat response:", response);
      
      // Update current chat
      const updatedChat: Chat = {
        id: response.chat_id,
        user_id: 0, // Will be set by backend
        title: currentChat?.title || messageText.slice(0, 50),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: response.messages
      };
      
      console.log("📝 Updating currentChat from", currentChat?.id, "to", updatedChat.id);
      setCurrentChat(updatedChat);
      currentChatRef.current = updatedChat;
      
      // Get the AI response (last message)
      const aiMessage = response.messages[response.messages.length - 1];
      
      // Add all messages except the AI response first
      const messagesWithoutAiResponse = response.messages.slice(0, -1);
      setMessages(messagesWithoutAiResponse);
      
      // Start typewriter effect for AI response after a small delay
      setTimeout(() => {
        // Add AI message with empty content initially
        const aiMessageForUI: Message = {
          ...aiMessage,
          content: "" // Will be filled by typewriter
        };
        setMessages(prev => [...prev, aiMessageForUI]);
        
        // Start typewriter effect
        startTypewriter(aiMessage.content, aiMessage.id);
      }, 500); // Small delay before starting to type
      
      // Refresh chats list and AI usage
      loadChats();
      loadAIUsage();
      
    } catch (error: any) {
      console.error("Failed to send message:", error);
      
      // Handle rate limit error specifically
      if (error?.status === 429 || error?.message?.includes('limit')) {
        toast({
          title: "محدودیت روزانه",
          description: error?.message || "شما به حد روزانه ۲۰ پیام رسیده‌اید. فردا دوباره تلاش کنید.",
          variant: "destructive",
        });
        // Refresh usage to show updated count
        loadAIUsage();
      }
      // Error toast for other errors is handled in api.ts
    } finally {
      setIsSending(false);
    }
  };

  const startNewChat = () => {
    // Stop any ongoing typewriter effect
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setIsTyping(false);
    setTypingMessageId(null);
    setDisplayedContent("");
    setOriginalContent("");
    setIsSending(false); // Reset sending state when starting new chat
    
    setCurrentChat(null);
    currentChatRef.current = null;
    setMessages([]);
    setIsDrawerOpen(false); // Close drawer when starting new chat
  };

  const deleteChat = async (chatId: number) => {
    try {
      await apiService.deleteChat(chatId);
      setChats(chats.filter(chat => chat.id !== chatId));
      
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        currentChatRef.current = null;
        setMessages([]);
      }

      // Show success message
      toast({
        title: "موفقیت",
        description: translateSuccess("Chat deleted"),
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to delete chat:", error);
      // Error toast is handled in api.ts
    }
  };

  // Component for chat history list (reusable for desktop sidebar and mobile drawer)
  const ChatHistoryList = ({ className = "" }: { className?: string }) => (
    <ScrollArea className={`h-[480px] ${className}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>هنوز مکالمه‌ای نداشته‌اید</p>
          <p className="text-sm">اولین سوال خود را بپرسید!</p>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                currentChat?.id === chat.id
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => loadChat(chat.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(chat.updated_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-100/40 to-purple-200/40 dark:from-blue-900/20 dark:to-purple-800/20 border-blue-200/70 dark:border-blue-700/50 rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    هوش مصنوعی ASL
                    <Sparkles className="w-6 h-6 text-blue-500" />
                  </h1>
                  <p className="text-blue-600 dark:text-blue-300">دستیار هوشمند شما در مسیر موفقیت تجاری</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Required Card */}
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-orange-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-4">
                ورود به حساب کاربری لازم است
              </h2>
              
              <p className="text-muted-foreground mb-8">
                برای استفاده از هوش مصنوعی ASL و شروع مکالمه، ابتدا باید وارد حساب کاربری خود شوید.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl h-12"
                >
                  <LogIn className="w-5 h-5 ml-2" />
                  ورود به حساب کاربری
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate("/signup")}
                  className="w-full border-border text-foreground hover:bg-muted rounded-2xl h-12"
                >
                  ثبت‌نام جدید
                </Button>
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-2xl">
                <h3 className="font-semibold text-foreground mb-2">قابلیت‌های هوش مصنوعی ASL:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 text-right">
                  <li>• راهنمایی در انتخاب محصولات صادراتی</li>
                  <li>• مشاوره بازاریابی بین‌المللی</li>
                  <li>• کمک در تحقیقات بازار کشورهای عربی</li>
                  <li>• راهنمایی فرآیندهای صادرات و واردات</li>
                  <li>• مشاوره برندسازی و بسته‌بندی</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if page was opened from search
  const isFromSearch = searchParams.get('search') !== null;

  return (
    <LicenseGate>
      <div className="min-h-screen bg-background" dir="rtl">
        {isFromSearch && <HeaderAuth />}
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-100/40 to-purple-200/40 dark:from-blue-900/20 dark:to-purple-800/20 border-blue-200/70 dark:border-blue-700/50 rounded-3xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  هوش مصنوعی ASL
                  <Sparkles className="w-6 h-6 text-blue-500" />
                </h1>
                <p className="text-blue-600 dark:text-blue-300">دستیار هوشمند شما در مسیر موفقیت تجاری</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 sm:gap-6 h-[calc(100vh-200px)] sm:h-[600px]">
          {/* Mobile: New Chat Button */}
          <div className="lg:hidden">
            <Button
              onClick={startNewChat}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 ml-1" />
              مکالمه جدید
            </Button>
          </div>

          {/* Sidebar - Chat History (Hidden on mobile unless toggled) */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">مکالمات</CardTitle>
                  <Button
                    onClick={startNewChat}
                    size="sm"
                    disabled={aiUsage?.remaining_count === 0}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    جدید
                  </Button>
                </div>
                {/* Usage info in sidebar */}
                {aiUsage && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">پیام‌های امروز:</span>
                      <Badge 
                        variant={aiUsage.remaining_count === 0 ? "destructive" : aiUsage.remaining_count <= 5 ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {aiUsage.message_count} / {aiUsage.daily_limit}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <ChatHistoryList />
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile Chat History Button */}
                  <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden p-2 h-8 w-8"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80 sm:w-96">
                      <SheetHeader className="mb-4">
                        <SheetTitle className="text-right">مکالمات شما</SheetTitle>
                      </SheetHeader>
                      
                      {/* New Chat Button */}
                      <div className="mb-4">
                        <Button
                          onClick={startNewChat}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          مکالمه جدید
                        </Button>
                      </div>
                      
                      {/* Chat History */}
                      <ChatHistoryList />
                    </SheetContent>
                  </Sheet>

                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">هوش مصنوعی ASL</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">آنلاین و آماده پاسخگویی</p>
                  </div>
                  <div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full ml-1 animate-pulse"></div>
                      فعال
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Messages Area */}
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-3 sm:p-4">
                  {!currentChat && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-2">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                        <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                        سلام! من هوش مصنوعی ASL هستم
                      </h3>
                      <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md text-sm sm:text-base">
                        دستیار هوشمند شما در مسیر موفقیت تجاری. چطور می‌تونم کمکتون کنم؟
                      </p>
                      
                      <div className="grid grid-cols-1 gap-2 sm:gap-3 w-full max-w-sm sm:max-w-2xl sm:grid-cols-2">
                        {[
                          "چطور محصولم رو در کشورهای عربی بفروشم؟",
                          "راهنمایی بازاریابی برای صادرات",
                          "کمک در انتخاب محصول مناسب",
                          "مشاوره برندسازی و بسته‌بندی"
                        ].map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="text-right justify-start p-3 sm:p-4 h-auto whitespace-normal text-xs sm:text-sm"
                            onClick={() => setInputMessage(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={message.id || index}
                          className={`flex ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-2 sm:p-3 rounded-2xl ${
                              message.role === "user"
                                ? "bg-blue-500 text-white rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm"
                            } ${
                              message.role === "assistant" && isTyping && typingMessageId === message.id
                                ? "cursor-pointer"
                                : ""
                            }`}
                                                         onClick={() => {
                               if (message.role === "assistant" && isTyping && typingMessageId === message.id) {
                                 skipTypewriter(message.id);
                               }
                             }}
                          >
                            <div className="flex items-start gap-1 sm:gap-2">
                              {message.role === "assistant" && (
                                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              )}
                              {message.role === "user" && (
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 mt-0.5 flex-shrink-0 order-2" />
                              )}
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.role === "assistant" && isTyping && typingMessageId === message.id
                                    ? displayedContent
                                    : message.content
                                  }
                                  {message.role === "assistant" && isTyping && typingMessageId === message.id && (
                                    <span className="animate-pulse">|</span>
                                  )}
                                </p>
                                <p className={`text-xs mt-1 sm:mt-2 opacity-70 ${
                                  message.role === "user" ? "text-white/70" : "text-muted-foreground"
                                }`}>
                                  {formatTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isSending && (
                        <div className="flex justify-start">
                          <div className="bg-muted p-2 sm:p-3 rounded-2xl rounded-tl-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                              <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm text-muted-foreground">در حال تایپ</span>
                                <div className="flex gap-1">
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-typing-dot"></div>
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-typing-dot" style={{ animationDelay: "0.2s" }}></div>
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-typing-dot" style={{ animationDelay: "0.4s" }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Typewriter hint */}
                      {isTyping && (
                        <div className="flex justify-center">
                          <p className="text-xs text-muted-foreground/70 italic">
                            برای دیدن کامل پیام، روی آن کلیک کنید
                          </p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                {/* Usage Information */}
                {aiUsage && (
                  <div className="px-3 sm:px-4 py-2 border-t bg-muted/30">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                      <span>پیام‌های امروز:</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={aiUsage.remaining_count === 0 ? "destructive" : aiUsage.remaining_count <= 5 ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {aiUsage.message_count} / {aiUsage.daily_limit}
                        </Badge>
                        {aiUsage.remaining_count > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            {aiUsage.remaining_count} باقی‌مانده
                          </span>
                        )}
                        {aiUsage.remaining_count === 0 && (
                          <span className="text-red-600 dark:text-red-400">
                            محدودیت تمام شد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 sm:p-4">
                  {aiUsage?.remaining_count === 0 && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400 text-center">
                        شما به حد روزانه ۲۰ پیام رسیده‌اید. فردا دوباره تلاش کنید.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="پیام خود را بنویسید..."
                      className="flex-1 bg-muted border-border text-foreground rounded-xl sm:rounded-2xl h-10 sm:h-auto text-sm sm:text-base"
                      disabled={isSending || isTyping || aiUsage?.remaining_count === 0}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !isSending && !isTyping && aiUsage?.remaining_count !== 0) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isSending || isTyping || aiUsage?.remaining_count === 0}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 h-10 sm:h-auto"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    هوش مصنوعی ASL ممکن است گاهی اشتباه کند. لطفاً اطلاعات مهم را بررسی کنید.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </LicenseGate>
  );
};

export default AslAI;