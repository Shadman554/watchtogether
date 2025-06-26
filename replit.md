# Watch Party Application

## Overview

This is a real-time watch party application that allows users to create and join virtual rooms to watch YouTube videos together. The application features synchronized video playback, real-time chat, and WebSocket-based communication to ensure all participants stay in sync.

## System Architecture

The application follows a full-stack TypeScript architecture with clear separation between client and server:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with WebSocket support
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time Communication**: WebSockets for video synchronization and chat

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application using Wouter for routing
- **Component Library**: shadcn/ui components for consistent UI/UX
- **State Management**: TanStack Query for server state management
- **Video Integration**: YouTube IFrame API for video playback
- **WebSocket Client**: Custom hook for real-time communication

### Backend Architecture
- **Express Server**: RESTful API endpoints and WebSocket server
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **WebSocket Management**: Room-based connection management for real-time features
- **Storage Interface**: Abstracted storage layer supporting both in-memory and database storage

### Database Schema
- **Rooms Table**: Stores room information including code, host/guest IDs, current video, and playback state
- **Messages Table**: Stores chat messages with room association and user information

### Real-time Features
- **Video Synchronization**: WebSocket messages for play/pause/seek events
- **Chat System**: Real-time messaging with emoji reactions
- **User Presence**: Connected user tracking and status updates

## Data Flow

1. **Room Creation**: Host creates room → generates unique code → stores in database
2. **Room Joining**: Guest enters room code → validates and joins → WebSocket connection established
3. **Video Loading**: Host loads YouTube video → broadcasts to all participants
4. **Playback Sync**: Any playback control → WebSocket broadcast → all clients sync
5. **Chat Messages**: User sends message → WebSocket broadcast → displayed to all participants

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Components**: Radix UI primitives, shadcn/ui component library
- **Database**: Drizzle ORM, @neondatabase/serverless for PostgreSQL
- **WebSockets**: ws library for real-time communication
- **Video Player**: YouTube IFrame API integration

### Development Tools
- **Build Tools**: Vite for frontend bundling, esbuild for server bundling
- **TypeScript**: Full type safety across the stack
- **CSS Framework**: Tailwind CSS with custom theme variables

## Deployment Strategy

The application is configured for Replit deployment with:

- **Development Mode**: `npm run dev` - runs server with Vite dev server
- **Production Build**: `npm run build` - builds both client and server
- **Production Start**: `npm run start` - serves built application
- **Database Migration**: `npm run db:push` - applies schema changes

### Environment Configuration
- PostgreSQL database connection via `DATABASE_URL`
- WebSocket server running on the same port as HTTP server
- Static file serving for built client assets

## Changelog

Changelog:
- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.