import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/services/api";

// Helper to get static file base URL from API base URL
const getStaticFileBaseUrl = (): string => {
  if (typeof window === 'undefined') return 'http://localhost:8080';
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Production server
  if (hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com') {
    // Use api.asllmarket.com for static files (backend serves them directly)
    return `${protocol}//api.${hostname}`;
  }
  
  // Development server
  return 'http://localhost:8080';
};
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Send, 
  MessageCircle, 
  User, 
  Clock,
  Check,
  CheckCheck,
  Loader2,
  Image as ImageIcon,
  X
} from "lucide-react";

interface ChatMessage {
  id: number;
  matching_chat_id: number;
  sender_id: number;
  sender_name: string;
  sender_type: 'supplier' | 'visitor';
  message: string;
  image_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface MatchingChatProps {
  requestId: number;
  onClose?: () => void;
}

export function MatchingChat({ requestId, onClose }: MatchingChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get image URL
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Ensure imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Get static file base URL - use api.asllmarket.com for backend static files
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // Production server - use api subdomain for backend static files
      if (hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com') {
        // Backend serves static files at /uploads via api.asllmarket.com
        const url = `${protocol}//api.${hostname}${normalizedPath}`;
        console.log('🖼️ Image URL (production via api subdomain):', url, 'from path:', imagePath);
        return url;
      }
      
      // Development server
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '82.115.24.33') {
        return `http://localhost:8080${normalizedPath}`;
      }
    }
    
    // Fallback
    return `http://localhost:8080${normalizedPath}`;
  };

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await apiService.getMatchingChatMessages(requestId, {
        page: 1,
        per_page: 100,
      });
      
      // Backend returns: { "messages": [...], "pagination": {...} }
      // Check both response.messages and response.data.messages for compatibility
      const messagesData = response.messages || response.data?.messages || response.data?.data?.messages;
      
      if (messagesData && Array.isArray(messagesData)) {
        // Format messages to match our interface
        const formattedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
          id: msg.id,
          matching_chat_id: msg.matching_chat_id || msg.matchingChatID,
          sender_id: msg.sender_id || msg.senderID,
          sender_name: msg.sender_name || msg.senderName,
          sender_type: msg.sender_type || msg.senderType,
          message: msg.message,
          image_url: msg.image_url || msg.imageURL || undefined,
          is_read: msg.is_read !== undefined ? msg.is_read : msg.isRead || false,
          read_at: msg.read_at || msg.readAt,
          created_at: msg.created_at || msg.createdAt,
        }));
        
        setMessages(formattedMessages);
        const pagination = response.data?.pagination || response.pagination;
        setHasMore(pagination ? pagination.page < pagination.total_pages : false);
      } else {
        console.warn('⚠️ No messages array found in response:', response);
      }
    } catch (error: any) {
      if (!silent) {
        toast({
          variant: "destructive",
          title: "خطا",
          description: error.message || "خطا در دریافت پیام‌ها",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفا فقط فایل تصویری انتخاب کنید",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "حجم فایل نباید بیشتر از 5MB باشد",
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const response = await apiService.uploadChatImage(formData);
      return response.image_url || null;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در آپلود تصویر",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || sending || uploadingImage) return;

    setSending(true);
    
    // Upload image first if selected
    let imageUrl: string | null = null;
    if (selectedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        setSending(false);
        return;
      }
    }

    const messageText = newMessage.trim();
    
    // Optimistically add message to UI
    const tempMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      matching_chat_id: 0,
      sender_id: user?.id || 0,
      sender_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'شما' : 'شما',
      sender_type: 'supplier', // Will be corrected by backend response
      message: messageText,
      image_url: imageUrl || undefined,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    removeImage();
    
    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(), 100);

    try {
      const response = await apiService.sendMatchingChatMessage(requestId, messageText, imageUrl || undefined);
      
      // Backend returns: { "message": { ... } }
      // Check both response.message and response.data.message for compatibility
      const sentMessage = response.message || response.data?.message;
      
      if (sentMessage) {
        // Convert backend format to frontend format
        const formattedMessage: ChatMessage = {
          id: sentMessage.id,
          matching_chat_id: sentMessage.matching_chat_id || sentMessage.matchingChatID,
          sender_id: sentMessage.sender_id || sentMessage.senderID,
          sender_name: sentMessage.sender_name || sentMessage.senderName,
          sender_type: sentMessage.sender_type || sentMessage.senderType,
          message: sentMessage.message,
          image_url: sentMessage.image_url || sentMessage.imageURL || undefined,
          is_read: sentMessage.is_read !== undefined ? sentMessage.is_read : sentMessage.isRead || false,
          read_at: sentMessage.read_at || sentMessage.readAt,
          created_at: sentMessage.created_at || sentMessage.createdAt,
        };
        
        // Replace temp message with real one from server
        setMessages(prev => {
          // Remove temp message and add real one
          const filtered = prev.filter(m => m.id !== tempMessage.id);
          return [...filtered, formattedMessage];
        });
        
        // Scroll to bottom after message is added
        setTimeout(() => scrollToBottom(), 100);
        
        // Reload messages after a short delay to ensure consistency
        setTimeout(() => {
          loadMessages(true);
        }, 1000);
      } else {
        // If response doesn't have message, reload all messages
        console.warn('⚠️ No message in response, reloading messages...', response);
        setTimeout(() => {
          loadMessages(true);
        }, 500);
      }
    } catch (error: any) {
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ارسال پیام",
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "همین الان";
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    if (days < 7) return `${days} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  const isMyMessage = (message: ChatMessage) => {
    return message.sender_id === user?.id;
  };

  if (loading && messages.length === 0) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            چت Matching
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              بستن
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 min-h-0" ref={scrollAreaRef}>
          <div className="space-y-4 w-full">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>هنوز پیامی ارسال نشده است</p>
                <p className="text-sm mt-2">اولین پیام را ارسال کنید</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = isMyMessage(message);
                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] min-w-0 rounded-2xl px-4 py-2 ${
                        isMine
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {!isMine && (
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-3 h-3" />
                          <span className="text-xs font-semibold opacity-80">
                            {message.sender_name}
                          </span>
                          <Badge variant="secondary" className="text-xs h-4 px-1.5">
                            {message.sender_type === 'supplier' ? 'تأمین‌کننده' : 'ویزیتور'}
                          </Badge>
                        </div>
                      )}
                      {message.image_url && (
                        <div className="mb-2 rounded-lg overflow-hidden max-w-full">
                          <img
                            src={getImageUrl(message.image_url)}
                            alt="پیام تصویری"
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxWidth: '100%', height: 'auto' }}
                            onClick={() => {
                              // Open image in new tab
                              window.open(getImageUrl(message.image_url), '_blank');
                            }}
                            onError={(e) => {
                              console.error('❌ Error loading image:', message.image_url, 'Current src:', e.currentTarget.src);
                              // Try alternative URL if first one fails
                              const currentSrc = e.currentTarget.src;
                              const hostname = window.location.hostname;
                              const protocol = window.location.protocol;
                              
                              // If current URL includes /backend, try without /backend
                              if (currentSrc.includes('/backend/uploads')) {
                                const altUrl = `${protocol}//${hostname}${message.image_url}`;
                                console.log('🔄 Trying alternative URL (without /backend):', altUrl);
                                if (currentSrc !== altUrl) {
                                  e.currentTarget.src = altUrl;
                                } else {
                                  e.currentTarget.style.display = 'none';
                                }
                              } else {
                                // If direct path failed, try with /backend
                                const altUrl = `${protocol}//${hostname}/backend${message.image_url}`;
                                console.log('🔄 Trying alternative URL (with /backend):', altUrl);
                                if (currentSrc !== altUrl) {
                                  e.currentTarget.src = altUrl;
                                } else {
                                  // Both failed, hide image
                                  console.error('❌ Both URLs failed, hiding image');
                                  e.currentTarget.style.display = 'none';
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                      {message.message && (
                        <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
                          {message.message}
                        </p>
                      )}
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="text-xs opacity-70 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(message.created_at)}
                        </span>
                        {isMine && (
                          <span className="opacity-70">
                            {message.is_read ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t p-4 bg-muted/30 shrink-0">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block max-w-full">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="پیش‌نمایش"
                  className="max-w-xs max-h-32 h-auto rounded-lg border-2 border-blue-300 object-contain"
                  style={{ maxWidth: '100%' }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploadingImage}
              className="shrink-0"
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 min-w-0"
              disabled={sending || uploadingImage}
            />
            <Button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

