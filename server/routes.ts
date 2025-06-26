import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
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
