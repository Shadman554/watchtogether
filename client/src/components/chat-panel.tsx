import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Smile, Heart, ThumbsUp, Users, MessageCircle, Sparkles, Clock, Check, CheckCheck } from "lucide-react";

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

const EMOJI_REACTIONS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖",
  "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
  "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔",
  "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦",
  "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴",
  "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿",
  "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖",
  "🎭", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉",
  "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤏", "💪",
  "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁",
  "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸", "💯", "💢",
  "💥", "💫", "💦", "💨", "🕳️", "💣", "💬", "🗨️", "🗯️", "💭",
  "💤", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", 
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔",
  "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
  "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
  "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
  "🔥", "💧", "🌊", "⚡", "☄️", "❄️", "☀️", "🌤️", "⛅", "🌦️",
  "🌧️", "⛈️", "🌩️", "🌨️", "☁️", "🌪️", "🌫️", "🌬️", "🌀",
  "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁", "🍭", "🍬",
  "🍫", "🍩", "🍪", "🎪", "🎨", "🎬", "🎤", "🎧", "🎼", "🎵", 
  "🎶", "🎸", "🥁", "🎺", "🎷", "🎹", "🎻", "🪕", "🏆", "🥇", 
  "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾"
];
const QUICK_REACTIONS = ["🎬", "📺", "🍿", "👀", "🔥", "💯", "😍", "🤣"];

export default function ChatPanel({ isVisible, messages, onSendMessage, onClose, currentUserId }: ChatPanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number>();

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
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Typing indicator logic
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
    }, 1000);
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
    let date;
    if (message.createdAt) {
      date = new Date(message.createdAt);
    } else if (message.timestamp) {
      date = new Date(message.timestamp);
    } else {
      date = new Date();
    }
    
    // Ensure date is valid
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`fixed top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-slate-900/98 border-l border-slate-700/50 transform transition-all duration-300 ease-out z-50 shadow-xl backdrop-blur-sm ${
      isVisible ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <Card className="h-full bg-transparent border-0 flex flex-col">
        {/* Clean Professional Header */}
        <CardHeader className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Chat</h3>
                <p className="text-xs text-gray-400">Real-time messaging</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Clean Messages Container */}
        <CardContent className="flex-1 p-4 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-2 mb-4">
            <div className="space-y-3 md:space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-white mb-2">No messages yet</h4>
                  <p className="text-sm text-gray-400">Start a conversation while watching</p>
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
                      <div key={message.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-up group mb-3`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className={`max-w-[85%] md:max-w-[80%] relative`}>
                          {/* Enhanced Emoji Bubble with Smooth Animations */}
                          <div className={`p-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl transform group-hover:translate-y-[-2px] ${
                            isOwn
                              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                              : 'bg-gradient-to-r from-slate-700 to-slate-600 text-gray-100'
                          }`}>
                            {/* Enhanced Username and timestamp */}
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-medium ${
                                isOwn ? 'text-purple-100' : 'text-gray-300'
                              }`}>
                                {message.username}
                              </span>
                              <span className={`text-xs ${
                                isOwn ? 'text-purple-200' : 'text-gray-400'
                              }`}>
                                {formatMessageTime(message)}
                              </span>
                            </div>
                            {/* Animated Emoji content */}
                            <div className="flex items-center justify-center">
                              <span className="text-3xl animate-bounce hover:animate-pulse cursor-default transition-all duration-300" style={{ animationDuration: '1s', animationIterationCount: '2' }}>{message.content}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-up group mb-3`} style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className={`max-w-[85%] md:max-w-[80%] relative`}>
                        {/* Enhanced Message Bubble with Smooth Animations */}
                        <div className={`p-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl transform group-hover:translate-y-[-2px] ${
                          isOwn
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                            : 'bg-gradient-to-r from-slate-700 to-slate-600 text-gray-100'
                        }`}>
                          {/* Simple Username and timestamp */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-medium ${
                              isOwn ? 'text-purple-100' : 'text-gray-300'
                            }`}>
                              {message.username}
                            </span>
                            <span className={`text-xs ${
                              isOwn ? 'text-purple-200' : 'text-gray-400'
                            }`}>
                              {formatMessageTime(message)}
                            </span>
                          </div>
                          {/* Message content */}
                          <p className="text-sm leading-relaxed break-words">
                            {message.content}
                          </p>
                          
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
          <div className="flex-shrink-0 pt-4 border-t border-slate-700/50 bg-slate-800/30">

            {/* Premium Animated Text Input */}
            <div className="space-y-3">
              {isTyping && (
                <div className="flex items-center space-x-3 text-sm text-purple-300 animate-fade-up bg-slate-800/50 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>Typing...</span>
                </div>
              )}
              
              <div className="flex space-x-3 relative">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-gradient-to-r from-slate-800/90 to-slate-700/90 border-slate-600/50 text-white placeholder-gray-300 focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/30 py-3 px-4 pr-16 rounded-xl transition-all duration-300 text-sm font-medium shadow-lg backdrop-blur-sm hover:shadow-xl focus:shadow-purple-500/20"
                  />
                  {messageInput.length > 0 && (
                    <div className={`absolute right-12 top-1/2 transform -translate-y-1/2 text-xs ${
                      messageInput.length > 200 ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {messageInput.length}/250
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 p-1 rounded-lg transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-600 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:opacity-50 group shadow-lg"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Button>
              </div>
              
              {/* Simple Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-2 p-3 bg-slate-800/90 rounded-xl border border-slate-600/50 animate-fade-up shadow-lg">
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_REACTIONS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleEmojiReaction(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-xl hover:bg-slate-700 rounded-lg p-2 h-auto transition-all duration-200 hover:scale-110"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
