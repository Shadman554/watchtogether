import { rooms, messages, type Room, type InsertRoom, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  updateRoom(code: string, updates: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(code: string): Promise<boolean>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRoom(roomCode: string, limit?: number): Promise<Message[]>;
  
  // User operations
  addUserToRoom(roomCode: string, userId: string, isHost: boolean): Promise<Room | undefined>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private messages: Map<string, Message[]>;
  private currentRoomId: number;
  private currentMessageId: number;

  constructor() {
    this.rooms = new Map();
    this.messages = new Map();
    this.currentRoomId = 1;
    this.currentMessageId = 1;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      ...insertRoom,
      id: this.currentRoomId++,
      createdAt: new Date(),
    };
    this.rooms.set(room.code, room);
    this.messages.set(room.code, []);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return this.rooms.get(code);
  }

  async updateRoom(code: string, updates: Partial<InsertRoom>): Promise<Room | undefined> {
    const room = this.rooms.get(code);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(code, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(code: string): Promise<boolean> {
    const deleted = this.rooms.delete(code);
    this.messages.delete(code);
    return deleted;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: this.currentMessageId++,
      createdAt: new Date(),
    };
    
    const roomMessages = this.messages.get(insertMessage.roomCode) || [];
    roomMessages.push(message);
    this.messages.set(insertMessage.roomCode, roomMessages);
    
    return message;
  }

  async getMessagesByRoom(roomCode: string, limit: number = 50): Promise<Message[]> {
    const messages = this.messages.get(roomCode) || [];
    return messages.slice(-limit);
  }

  async addUserToRoom(roomCode: string, userId: string, isHost: boolean): Promise<Room | undefined> {
    const room = this.rooms.get(roomCode);
    if (!room) return undefined;

    if (isHost) {
      room.hostId = userId;
    } else {
      room.guestId = userId;
    }

    this.rooms.set(roomCode, room);
    return room;
  }
}

export const storage = new MemStorage();
