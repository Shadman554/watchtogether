import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fetch from "node-fetch";
import { storage } from "./storage";
import { insertRoomSchema, insertMessageSchema } from "@shared/schema";
import type { WebSocketMessage, SyncMessage, ChatMessage, UserJoinMessage, PlaybackControlMessage } from "@shared/schema";

interface WebSocketClient extends WebSocket {
  roomCode?: string;
  userId?: string;
  username?: string;
  isHost?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections by room
  const roomConnections = new Map<string, Set<WebSocketClient>>();

  // Generate unique room code
  function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Generate unique user ID
  function generateUserId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Proxy endpoint for bypassing CORS and iframe restrictions
  app.get('/api/proxy-video', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }

      console.log('Proxying video URL:', url);
      
      // Fetch the video with our server's headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
          'Range': req.headers.range || 'bytes=0-',
          'Referer': 'https://myflixerz.to/',
          'Origin': 'https://myflixerz.to',
        }
      });

      // Set appropriate headers for video streaming
      res.set({
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Length': response.headers.get('content-length'),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });

      // Stream the video content
      response.body?.pipe(res);
      
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Proxy failed' });
    }
  });

  // Video URL extraction endpoint for bypassing iframe restrictions  
  app.get('/api/extract-video', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }
      
      console.log('Extracting video URL from:', url);
      
      // Extract video URL from streaming sites
      if (url.includes('myflixerz.to')) {
        try {
          // Enhanced extraction with better headers and techniques
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Upgrade-Insecure-Requests': '1',
              'Referer': 'https://myflixerz.to/',
              'Connection': 'keep-alive'
            }
          });
          
          const html = await response.text();
          console.log('Fetched myflixerz page, analyzing with advanced patterns...');
          
          // Enhanced patterns for modern streaming sites
          const videoPatterns = [
            // Common video source patterns
            /<source[^>]+src=["']([^"']+\.(mp4|m3u8|webm)[^"']*)/gi,
            /<video[^>]+src=["']([^"']+\.(mp4|m3u8|webm)[^"']*)/gi,
            
            // JavaScript variable patterns
            /(?:file|source|src|url)["']?\s*[:=]\s*["']([^"']+\.(mp4|m3u8|webm)[^"']*)/gi,
            /(?:video_url|videoUrl|video-url)["']?\s*[:=]\s*["']([^"']+)/gi,
            
            // JSON patterns
            /"(?:file|source|src|url)":\s*"([^"]+\.(mp4|m3u8|webm)[^"]*)"/gi,
            /"sources":\s*\[.*?"src":\s*"([^"]+\.(mp4|m3u8|webm)[^"]*)"/gi,
            
            // URL patterns in JavaScript
            /https?:\/\/[^"'\s]+\.(mp4|m3u8|webm)(?:\?[^"'\s]*)?/gi,
            
            // Streaming service patterns
            /embed[^"']*\/([a-zA-Z0-9]+)/gi,
            /player[^"']*\/([a-zA-Z0-9]+)/gi
          ];
          
          const foundUrls = new Set();
          
          for (const pattern of videoPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
              const potentialUrl = match[1] || match[0];
              if (potentialUrl && (
                potentialUrl.includes('.mp4') || 
                potentialUrl.includes('.m3u8') ||
                potentialUrl.includes('.webm') ||
                potentialUrl.includes('video') ||
                potentialUrl.includes('stream')
              )) {
                const cleanUrl = potentialUrl.startsWith('http') ? potentialUrl : 
                               potentialUrl.startsWith('//') ? `https:${potentialUrl}` :
                               `https://${potentialUrl}`;
                foundUrls.add(cleanUrl);
              }
            }
          }
          
          if (foundUrls.size > 0) {
            const videoUrl = Array.from(foundUrls)[0];
            console.log('Found video URL:', videoUrl);
            return res.json({ 
              success: true, 
              videoUrl 
            });
          }
          
          // Try to find iframe embed sources as fallback
          const iframePattern = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
          let iframeMatch;
          while ((iframeMatch = iframePattern.exec(html)) !== null) {
            const iframeSrc = iframeMatch[1];
            if (iframeSrc && !iframeSrc.includes('youtube') && !iframeSrc.includes('ads')) {
              console.log('Found iframe source for further extraction:', iframeSrc);
              // Recursively try to extract from iframe source
              try {
                const nestedResponse = await fetch(`/api/extract-video?url=${encodeURIComponent(iframeSrc)}`);
                const nestedData = await nestedResponse.json();
                if (nestedData.success) {
                  return res.json(nestedData);
                }
              } catch (e) {
                console.log('Nested extraction failed');
              }
            }
          }
          
          console.log('No extractable video URLs found in myflixerz page');
        } catch (e) {
          console.error('MyFlixerz extraction error:', e);
        }
      }
      
      if (url.includes('yourupload.com')) {
        const videoId = url.match(/embed\/([^?\/]+)/)?.[1];
        if (videoId) {
          console.log('YouUpload extraction currently disabled - using iframe fallback');
        }
      }
      
      console.log('Could not extract direct video URL');
      res.json({ success: false, error: 'Could not extract direct video URL' });
      
    } catch (error) {
      console.error('Video extraction error:', error);
      res.status(500).json({ error: 'Internal server error during video extraction' });
    }
  });

  // Broadcast to all clients in a room
  function broadcastToRoom(roomCode: string, message: WebSocketMessage, excludeClient?: WebSocketClient) {
    const clients = roomConnections.get(roomCode);
    if (!clients) return;

    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_room':
            const { roomCode, userId, username, isHost } = message.payload;
            
            // Verify room exists or create if host
            let room = await storage.getRoomByCode(roomCode);
            if (!room && isHost) {
              room = await storage.createRoom({
                code: roomCode,
                hostId: userId,
                guestId: null,
                currentVideoId: null,
                currentTime: 0,
                isPlaying: false,
              });
            }

            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room not found' },
                timestamp: Date.now(),
              }));
              return;
            }

            // Check room capacity
            const roomClients = roomConnections.get(roomCode) || new Set();
            if (roomClients.size >= 2 && !Array.from(roomClients).some(c => c.userId === userId)) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room is full' },
                timestamp: Date.now(),
              }));
              return;
            }

            // Set client properties
            ws.roomCode = roomCode;
            ws.userId = userId;
            ws.username = username;
            ws.isHost = isHost;

            // Add to room connections
            if (!roomConnections.has(roomCode)) {
              roomConnections.set(roomCode, new Set());
            }
            roomConnections.get(roomCode)!.add(ws);

            // Update room with user
            await storage.addUserToRoom(roomCode, userId, isHost);

            // Send join confirmation with current room state
            ws.send(JSON.stringify({
              type: 'joined_room',
              payload: { 
                room,
                userId,
                isHost,
                connectedUsers: Array.from(roomClients).map(c => ({
                  userId: c.userId,
                  username: c.username,
                  isHost: c.isHost,
                }))
              },
              timestamp: Date.now(),
            }));

            // Send current video state to new joiner if there's a video loaded
            if (room.currentVideoId) {
              console.log(`Sending current video to new joiner: ${room.currentVideoId}`);
              ws.send(JSON.stringify({
                type: 'playback_control',
                payload: {
                  action: 'video_change',
                  currentTime: room.currentTime || 0,
                  videoId: room.currentVideoId,
                },
                timestamp: Date.now(),
              }));
            }

            // Broadcast user join to others
            const joinMessage: UserJoinMessage = {
              type: 'user_join',
              payload: { userId, username, isHost },
              timestamp: Date.now(),
            };
            broadcastToRoom(roomCode, joinMessage, ws);

            // Send recent messages
            const recentMessages = await storage.getMessagesByRoom(roomCode, 20);
            ws.send(JSON.stringify({
              type: 'message_history',
              payload: { messages: recentMessages },
              timestamp: Date.now(),
            }));

            break;

          case 'sync':
            if (!ws.roomCode) return;
            
            const syncMessage = message as SyncMessage;
            
            // Update room state
            await storage.updateRoom(ws.roomCode, {
              currentTime: syncMessage.payload.currentTime,
              isPlaying: syncMessage.payload.isPlaying,
              currentVideoId: syncMessage.payload.videoId,
            });

            // Broadcast sync to other user
            broadcastToRoom(ws.roomCode, syncMessage, ws);
            break;

          case 'playback_control':
            if (!ws.roomCode) return;
            
            const controlMessage = message as PlaybackControlMessage;
            
            // Update room state based on control
            const updates: any = {};
            if (controlMessage.payload.action === 'play') {
              updates.isPlaying = true;
            } else if (controlMessage.payload.action === 'pause') {
              updates.isPlaying = false;
            } else if (controlMessage.payload.action === 'video_change') {
              // Handle video change - update the current video URL
              updates.isPlaying = false;
              updates.currentTime = 0;
            }
            
            if (controlMessage.payload.currentTime !== undefined) {
              updates.currentTime = controlMessage.payload.currentTime;
            }
            
            if (controlMessage.payload.videoId) {
              updates.currentVideoId = controlMessage.payload.videoId;
            }

            await storage.updateRoom(ws.roomCode, updates);

            // Broadcast control to other user
            broadcastToRoom(ws.roomCode, controlMessage, ws);
            console.log(`Broadcasting ${controlMessage.payload.action} to room ${ws.roomCode}`, controlMessage.payload);
            break;

          case 'webrtc_signal':
            if (!ws.roomCode) return;
            
            // Validate WebRTC signal payload
            if (!message.payload || !message.payload.type || !message.payload.data) {
              console.error('Invalid WebRTC signal payload:', message.payload);
              return;
            }
            
            // Forward WebRTC signaling messages to other users in the room
            console.log(`Forwarding WebRTC signal in room ${ws.roomCode}:`, message.payload.type);
            broadcastToRoom(ws.roomCode, message, ws);
            break;

          case 'voice_offer':
          case 'voice_answer':
          case 'voice_ice':
            if (!ws.roomCode) return;
            
            // Forward voice signaling messages to other users in the room
            console.log(`Forwarding voice signal in room ${ws.roomCode}:`, message.type);
            broadcastToRoom(ws.roomCode, message, ws);
            break;

          case 'chat':
            if (!ws.roomCode || !ws.userId || !ws.username) return;
            
            const chatData = message.payload;
            
            // Store message
            const savedMessage = await storage.createMessage({
              roomCode: ws.roomCode,
              userId: ws.userId,
              username: ws.username,
              content: chatData.content,
              type: chatData.messageType || 'text',
            });

            // Broadcast to all users in room
            const chatMessage: ChatMessage = {
              type: 'chat',
              payload: {
                id: savedMessage.id,
                userId: ws.userId,
                username: ws.username,
                content: chatData.content,
                messageType: chatData.messageType || 'text',
              },
              timestamp: Date.now(),
            };
            broadcastToRoom(ws.roomCode, chatMessage);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now(),
        }));
      }
    });

    ws.on('close', () => {
      if (ws.roomCode) {
        const roomClients = roomConnections.get(ws.roomCode);
        if (roomClients) {
          roomClients.delete(ws);
          
          // Notify other user of disconnect
          if (ws.userId) {
            broadcastToRoom(ws.roomCode, {
              type: 'user_disconnect',
              payload: { userId: ws.userId, username: ws.username },
              timestamp: Date.now(),
            });
          }

          // Clean up empty rooms
          if (roomClients.size === 0) {
            roomConnections.delete(ws.roomCode);
            storage.deleteRoom(ws.roomCode);
          }
        }
      }
    });
  });

  // REST API endpoints
  app.post('/api/rooms', async (req, res) => {
    try {
      const code = generateRoomCode();
      const userId = generateUserId();
      
      const room = await storage.createRoom({
        code,
        hostId: userId,
        guestId: null,
        currentVideoId: null,
        currentTime: 0,
        isPlaying: false,
      });

      res.json({ room, userId });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create room' });
    }
  });

  app.get('/api/rooms/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const room = await storage.getRoomByCode(code);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const userId = generateUserId();
      res.json({ room, userId });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get room' });
    }
  });

  return httpServer;
}
