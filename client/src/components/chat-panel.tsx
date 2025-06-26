import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send } from "lucide-react";

interface Message {
  id: number;
  userId: string;
  username: string;
  content: string;
  type: string;
  createdAt?: Date;
  timestamp?: number;
}

interface ChatPanelProps {
  isVisible: boolean;
  messages: Message[];
  onSendMessage: (content: string, type?: string) => void;
  onClose: () => void;
  currentUserId: string;
}

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😭", "🔥"];

export default function ChatPanel({ isVisible, messages, onSendMessage, onClose, currentUserId }: ChatPanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    onSendMessage(messageInput.trim(), "text");
    setMessageInput("");
  };

  const handleEmojiReaction = (emoji: string) => {
    onSendMessage(emoji, "emoji");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (message: Message) => {
    const date = message.createdAt || (message.timestamp ? new Date(message.timestamp) : new Date());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`absolute top-0 right-0 w-full md:w-80 h-full bg-cinema-dark/95 backdrop-blur-sm border-l border-gray-700 transform transition-transform duration-300 z-40 ${
      isVisible ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <Card className="h-full bg-transparent border-0">
        {/* Mobile-Responsive Chat Header */}
        <CardHeader className="p-3 md:p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm md:text-base">Chat & Voice</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 md:p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Voice Status - Mobile Responsive */}
          <div className="flex items-center space-x-1 md:space-x-2 mt-2 md:mt-3">
            <div className="flex items-center space-x-1 md:space-x-2 bg-sync-green/20 rounded-full px-2 md:px-3 py-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-sync-green rounded-full animate-pulse" />
              <span className="text-xs text-white">Voice Connected</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-white p-1 h-auto hidden md:block"
            >
              Whisper Mode
            </Button>
          </div>
        </CardHeader>

        {/* Messages Container - Mobile Responsive */}
        <CardContent className="flex-1 p-2 md:p-4 h-full pb-0">
          <ScrollArea className={`pr-2 md:pr-4 chat-messages ${isVisible ? 'h-[calc(100vh-160px)] md:h-[calc(100vh-200px)]' : 'h-0'}`}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.userId === currentUserId;
                  const isSystem = message.type === 'system';
                  const isEmoji = message.type === 'emoji';

                  if (isSystem) {
                    return (
                      <div key={message.id || index} className="text-center">
                        <span className="text-xs text-gray-500 bg-cinema-gray rounded-full px-3 py-1">
                          {message.content}
                        </span>
                      </div>
                    );
                  }

                  if (isEmoji) {
                    return (
                      <div key={message.id || index} className="text-center">
                        <span className="text-2xl">{message.content}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id || index} className={`flex space-x-3 ${isOwn ? 'justify-end' : ''}`}>
                      {!isOwn && (
                        <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {message.username.charAt(message.username.length - 1)}
                          </span>
                        </div>
                      )}
                      <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-2xl px-4 py-2 ${
                          isOwn 
                            ? 'bg-accent-purple text-white' 
                            : 'bg-cinema-gray text-white'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatMessageTime(message)}
                        </div>
                      </div>
                      {isOwn && (
                        <div className="w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {message.username.charAt(message.username.length - 1)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Mobile-Responsive Chat Input */}
          <div className="pt-2 md:pt-4 border-t border-gray-700 mt-2 md:mt-4">
            {/* Quick Reactions - Mobile Responsive */}
            <div className="flex justify-center space-x-1 md:space-x-2 mb-2 md:mb-3">
              {EMOJI_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmojiReaction(emoji)}
                  className="text-base md:text-xl hover:scale-110 transition-transform p-1 md:p-2 h-auto"
                >
                  {emoji}
                </Button>
              ))}
            </div>

            {/* Text Input - Mobile Responsive */}
            <div className="flex space-x-1 md:space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-cinema-gray border-gray-600 text-white placeholder-gray-500 focus:border-accent-blue text-sm h-8 md:h-10"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-accent-purple hover:bg-accent-purple/80 px-2 md:px-4 h-8 md:h-10"
              >
                <Send className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
