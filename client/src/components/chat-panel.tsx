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
    <div className={`fixed top-0 right-0 w-full md:w-80 h-full glass-dark border-l border-purple-500/20 transform transition-transform duration-500 z-50 ${
      isVisible ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <Card className="h-full bg-transparent border-0 flex flex-col">
        {/* Premium Mobile Chat Header */}
        <CardHeader className="p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Live Chat</h3>
                <p className="text-xs text-gray-400">Real-time messaging</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Container - Mobile Responsive */}
        <CardContent className="flex-1 p-4 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-12 animate-fade-up">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Ready to Chat</h4>
                  <p className="text-sm leading-relaxed">Start your conversation and enjoy<br />real-time messaging while watching!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.userId === currentUserId;
                  const isSystem = message.type === 'system';
                  const isEmoji = message.type === 'emoji';

                  if (isSystem) {
                    return (
                      <div key={message.id || index} className="text-center">
                        <span className="text-xs text-gray-500 bg-slate-800/50 rounded-full px-3 py-1 border border-slate-700/50">
                          {message.content}
                        </span>
                      </div>
                    );
                  }

                  if (isEmoji) {
                    return (
                      <div key={message.id || index} className="text-center">
                        <span className="text-3xl animate-scale-in">{message.content}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-up`} style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className={`max-w-[80%] group ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div className={`p-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 ${
                          isOwn
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white ml-2'
                            : 'bg-slate-800/80 text-gray-100 mr-2 border border-slate-700/50'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${
                              isOwn ? 'text-purple-100' : 'text-purple-400'
                            }`}>
                              {message.username}
                            </span>
                            <span className={`text-xs ${
                              isOwn ? 'text-purple-200' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Premium Chat Input - Fixed at bottom */}
          <div className="flex-shrink-0 pt-4 border-t border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
            {/* Quick Reactions */}
            <div className="flex justify-center space-x-2 mb-3">
              {EMOJI_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmojiReaction(emoji)}
                  className="text-lg hover:scale-110 transition-all duration-300 p-2 h-auto hover:bg-purple-500/20 rounded-lg"
                >
                  {emoji}
                </Button>
              ))}
            </div>

            {/* Enhanced Text Input */}
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 py-3 px-4 rounded-xl transition-all duration-300"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
