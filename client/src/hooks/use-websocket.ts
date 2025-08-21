import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface ConnectedUser {
  userId: string;
  username: string;
  isHost: boolean;
}

interface Message {
  id: number;
  userId: string;
  username: string;
  content: string;
  type: string;
  createdAt?: Date;
  timestamp?: number;
}

interface SyncStatus {
  isSync: boolean;
  latency: number;
  remoteTime: number;
  remoteIsPlaying: boolean;
}

export function useWebSocket(roomCode: string, userId: string, username: string, isHost: boolean) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSync: false,
    latency: 0,
    remoteTime: 0,
    remoteIsPlaying: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Join the room
      ws.send(JSON.stringify({
        type: "join_room",
        payload: { roomCode, userId, username, isHost },
        timestamp: Date.now(),
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "joined_room":
            setConnectedUsers([
              { userId, username, isHost },
              ...message.payload.connectedUsers.filter((u: ConnectedUser) => u.userId !== userId)
            ]);
            setSyncStatus(prev => ({ ...prev, isSync: true }));
            toast({
              title: "Connected",
              description: `Joined room ${roomCode} successfully!`,
            });
            break;

          case "user_join":
            setConnectedUsers(prev => {
              const existing = prev.find(u => u.userId === message.payload.userId);
              if (existing) return prev;
              return [...prev, message.payload];
            });
            toast({
              title: "User Joined",
              description: `${message.payload.username} joined the room`,
            });
            break;

          case "user_disconnect":
            setConnectedUsers(prev => prev.filter(u => u.userId !== message.payload.userId));
            toast({
              title: "User Left",
              description: `${message.payload.username} left the room`,
            });
            break;

          case "chat":
            setMessages(prev => [...prev, {
              id: message.payload.id,
              userId: message.payload.userId,
              username: message.payload.username,
              content: message.payload.content,
              type: message.payload.messageType,
              timestamp: message.timestamp,
            }]);
            break;

          case "message_history":
            setMessages(message.payload.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.createdAt).getTime(),
            })));
            break;

          case "sync":
            setSyncStatus(prev => ({
              ...prev,
              remoteTime: message.payload.currentTime,
              remoteIsPlaying: message.payload.isPlaying,
              latency: Date.now() - message.timestamp,
            }));
            break;

          case "playback_control":
            console.log('Received playback control:', message.payload);
            
            // Handle remote playback control and update sync status
            setSyncStatus(prev => ({
              ...prev,
              remoteTime: message.payload.currentTime || prev.remoteTime,
              remoteIsPlaying: message.payload.action === 'play' ? true : 
                              message.payload.action === 'pause' ? false : prev.remoteIsPlaying,
              latency: Date.now() - message.timestamp,
            }));
            
            // Handle video change - only trigger when it's actually a different video
            if (message.payload.action === 'video_change' && message.payload.videoId) {
              console.log('Triggering video URL change event with:', message.payload.videoId);
              // Always trigger the event - let the room component decide if it's a real change
              window.dispatchEvent(new CustomEvent('videoUrlChange', {
                detail: { videoUrl: message.payload.videoId }
              }));
            }
            break;

          case "webrtc_signal":
            // Forward WebRTC signaling to voice call component
            if (message.payload && message.payload.type && message.payload.data) {
              window.dispatchEvent(new CustomEvent('webrtc_signal', {
                detail: message.payload
              }));
            } else {
              console.error('Invalid WebRTC signal received:', message.payload);
            }
            break;

          case "error":
            toast({
              title: "Error",
              description: message.payload.message,
              variant: "destructive",
            });
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setSyncStatus(prev => ({ ...prev, isSync: false }));
      
      // Only attempt to reconnect if the page is still active and not being refreshed
      if (document.visibilityState === 'visible' && !document.hidden) {
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            try {
              connect();
            } catch (error) {
              console.error("Reconnection failed:", error);
            }
          }
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Don't show error toast immediately - let reconnection handle it
      setTimeout(() => {
        if (!isConnected) {
          toast({
            title: "Connection Issue",
            description: "Trying to reconnect...",
            variant: "destructive",
          });
        }
      }, 5000);
    };
  }, [roomCode, userId, username, isHost, toast]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string, type = "text") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat",
        payload: { content, messageType: type },
        timestamp: Date.now(),
      }));
    }
  }, []);

  const sendSync = useCallback((currentTime: number, isPlaying: boolean, videoId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "sync",
        payload: { currentTime, isPlaying, videoId },
        timestamp: Date.now(),
      }));
    }
  }, []);

  const sendPlaybackControl = useCallback((action: string, currentTime?: number, videoId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "playback_control",
        payload: { action, currentTime, videoId },
        timestamp: Date.now(),
      }));
    }
  }, []);

  const sendWebRTCSignal = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && data && type) {
      wsRef.current.send(JSON.stringify({
        type: "webrtc_signal",
        payload: { type, data, userId },
        timestamp: Date.now(),
      }));
    } else {
      console.error('Cannot send WebRTC signal:', { connected: wsRef.current?.readyState === WebSocket.OPEN, type, hasData: !!data });
    }
  }, [userId]);

  return {
    ws: wsRef.current,
    isConnected,
    connectedUsers,
    messages,
    syncStatus,
    sendMessage,
    sendSync,
    sendPlaybackControl,
    sendWebRTCSignal,
  };
}
