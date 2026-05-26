import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from '../message/message.service';
import { ChatService } from './chat.service';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { RedisService } from '../redis/redis.service';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

interface JoinChatPayload {
  chatId: string;
}

interface SendMessagePayload {
  chatId?: string;
  messageText: string;
  modelIaId: number;
  randomUUID: string;
  selectedDepartments?:number[]
  selectedSystems?:number[]
}

interface TypingPayload {
  chatId: string;
  isTyping: boolean;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
    private readonly chatService: ChatService,
    private readonly redisService: RedisService
  ) {
  }

  async afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    try {
      const sub = this.redisService.getSubscriber();

      await sub.subscribe('chat_response');

      sub.on('message', (channel, message) => {
        if (channel === 'chat_response') {
          const data = JSON.parse(message);

          this.notifyMessageResponse(data.chatId, data);
        }
      });

    } catch (error) {
      this.logger.error('Error setting up Redis subscriber:', error);
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      const user = await this.prisma.user.findUnique({
        where: { userId: decoded.userId },
        select: { userId: true, active: true },
      });

      if (!user || user.active === false) {
        this.logger.warn(`Client ${client.id} - User not found or inactive`);
        client.disconnect(true);
        return;
      }

      client.user = decoded;
      this.logger.log(`Client connected: ${client.id} - User: ${decoded.userId}`);

      client.emit('connected', {
        status: 'success',
        message: 'Connected successfully',
        userId: decoded.userId
      });
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, (error as Error).message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-chat')
  async handleJoinChat(client: AuthenticatedSocket, payload: JoinChatPayload) {
    try {
      if (!client.user) {
        throw new WsException('Unauthorized');
      }

      const { chatId } = payload;

      const hasPermission = await this.chatService.checkPermSafe({
        userId: client.user.userId,
        typeUserId: client.user.userTypeId,
        bodyData: { chatId },
      });

      if (!hasPermission.ok) {
        throw new WsException('Unauthorized to join this chat');
      }

      const roomName = `chat:${chatId}`;
      await client.join(roomName);

      this.logger.log(`User ${client.user.userId} joined chat ${chatId}`);

      client.to(roomName).emit('user-joined', {
        userId: client.user.userId,
        timestamp: new Date().toISOString(),
      });

      return {
        event: 'joined-chat',
        data: { chatId, room: roomName },
      };
    } catch (error) {
      this.logger.error('Error joining chat:', (error as Error).message);
      throw new WsException((error as Error).message || 'Failed to join chat');
    }
  }

  @SubscribeMessage('leave-chat')
  async handleLeaveChat(client: AuthenticatedSocket, payload: JoinChatPayload) {
    try {
      if (!client.user) {
        throw new WsException('Unauthorized');
      }

      const { chatId } = payload;
      const roomName = `chat:${chatId}`;

      await client.leave(roomName);

      this.logger.log(`User ${client.user.userId} left chat ${chatId}`);

      client.to(roomName).emit('user-left', {
        userId: client.user.userId,
        timestamp: new Date().toISOString(),
      });

      return {
        event: 'left-chat',
        data: { chatId },
      };
    } catch (error) {
      this.logger.error('Error leaving chat:', (error as Error).message);
      throw new WsException((error as Error).message || 'Failed to leave chat');
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(client: AuthenticatedSocket, payload: SendMessagePayload) {
    try {
      if (!client.user) {
        throw new WsException('Unauthorized');
      }

      const { chatId, messageText, modelIaId,selectedDepartments,selectedSystems } = payload;

      if (!messageText || messageText.trim().length === 0) {
        throw new WsException('Message text cannot be empty');
      }

      console.log(payload)

      const createMessageDto: CreateMessageDto = {
        chatId,
        messageText: messageText.trim(),
        modelIaId: modelIaId,
        departmentsIds: selectedDepartments ? selectedDepartments : [],
        systemsIds: selectedSystems ? selectedSystems : []
      };

      const newChatId = await this.messageService.createClient({
        userId: client.user.userId,
        typeUserId: client.user.userTypeId ?? 1,
        bodyData: createMessageDto
      });

      const targetChatId = newChatId;
      const roomName = `chat:${targetChatId}`;

      this.server.to(roomName).emit('new-message', {
        chatId: targetChatId,
        messageText: createMessageDto.messageText,
        userId: client.user.userId,
        timestamp: new Date().toISOString(),
        status: 'PROCESSING',
      });

      return {
        event: 'message-sent',
        data: {
          chatId: targetChatId,
          status: 'PROCESSING'
        },
      };
    } catch (error) {
      this.logger.error('Error sending message:', (error as Error).message);
      throw new WsException((error as Error).message || 'Failed to send message');
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(client: AuthenticatedSocket, payload: TypingPayload) {
    try {
      if (!client.user) {
        throw new WsException('Unauthorized');
      }

      const { chatId, isTyping } = payload;
      const roomName = `chat:${chatId}`;

      client.to(roomName).emit('user-typing', {
        userId: client.user.userId,
        isTyping,
        timestamp: new Date().toISOString(),
      });

      return { event: 'typing-acknowledged' };
    } catch (error) {
      this.logger.error('Error handling typing:', (error as Error).message);
      throw new WsException((error as Error).message || 'Failed to handle typing');
    }
  }

  @SubscribeMessage('get-chat-messages')
  async handleGetMessages(client: AuthenticatedSocket, payload: { chatId: string; lastMessageId?: string }) {
    try {
      if (!client.user) {
        throw new WsException('Unauthorized');
      }

      const { chatId, lastMessageId } = payload;

      const messages = await this.messageService.findMessagesWithPagination({
        userId: client.user.userId,
        typeUserId: client.user.userTypeId,
        bodyData: { chatId, lastMessageId },
      });

      return {
        event: 'chat-messages',
        data: messages,
      };
    } catch (error) {
      this.logger.error('Error fetching messages:', (error as Error).message);
      throw new WsException((error as Error).message || 'Failed to fetch messages');
    }
  }

  public async notifyMessageResponse(chatId: string, data: {
    messageId: string;
    messageText: string;
    status: string;
    error?: string;
  }) {
    const roomName = `chat:${chatId}`;

    this.server.to(roomName).emit('message-response', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notified room ${roomName} about message ${data.messageId} status: ${data.status}`);
  }

  public async notifyNewMessage(chatId: string, message: any) {
    const roomName = `chat:${chatId}`;

    this.server.to(roomName).emit('new-message', {
      ...message,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcasted new message to room ${roomName}`);
  }

  private extractToken(client: Socket): string | null {
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c) => {
          const parts = c.trim().split('=');
          return [parts[0], parts.slice(1).join('=')];
        })
      );
      if (cookies['access_token']) {
        return cookies['access_token'];
      }
    }

    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (client.handshake.auth && client.handshake.auth.token) {
      return client.handshake.auth.token;
    }

    if (client.handshake.query && client.handshake.query.token) {
      return client.handshake.query.token as string;
    }

    return null;
  }

  private async getLastCreatedChatId(userId: number): Promise<string> {
    const lastChat = await this.prisma.chat.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { chatId: true },
    });

    if (!lastChat) {
      throw new WsException('No chat found for user');
    }

    return lastChat.chatId;
  }
}
