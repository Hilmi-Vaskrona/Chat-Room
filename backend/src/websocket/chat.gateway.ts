import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { GroupsService } from '../groups/groups.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // Allows frontend connections
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
    private readonly groupsService: GroupsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers['authorization'] as string)?.replace('Bearer ', '') ||
        client.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        this.logger.warn(`Client ${client.id} disconnected: token missing`);
        client.emit('socketError', { message: 'Token otentikasi tidak disediakan' });
        client.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'super-secret-jwt-chat-room-key-at-least-32-chars-long';

      const payload = this.jwtService.verify(token, { secret });
      client.user = {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
      };

      // Also join individual user room for direct user notifications (like mentions)
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client ${client.id} connected as user ${payload.username}`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} failed auth: ${error.message}`);
      client.emit('socketError', { message: 'Token tidak valid atau kedaluwarsa' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { groupId: string },
  ) {
    try {
      if (!client.user) {
        client.emit('socketError', { message: 'Belum terautentikasi' });
        return;
      }

      if (!payload?.groupId) {
        client.emit('socketError', { message: 'groupId wajib disertakan' });
        return;
      }

      // Verify membership
      const membership = await this.groupsService.checkMembership(
        payload.groupId,
        client.user.id,
      );

      if (!membership) {
        client.emit('socketError', {
          message: 'Anda bukan anggota grup ini sehingga tidak dapat bergabung ke room',
        });
        return;
      }

      const roomName = `group:${payload.groupId}`;
      client.join(roomName);
      this.logger.log(`User ${client.user.username} joined room ${roomName}`);

      client.emit('joinedGroup', {
        groupId: payload.groupId,
        message: `Berhasil terhubung ke room grup`,
      });
    } catch (error: any) {
      this.logger.error(`Error joining group room: ${error.message}`);
      client.emit('socketError', { message: error.message || 'Gagal masuk ke room grup' });
    }
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { groupId: string },
  ) {
    if (payload?.groupId) {
      const roomName = `group:${payload.groupId}`;
      client.leave(roomName);
      client.emit('leftGroup', { groupId: payload.groupId });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: {
      groupId: string;
      content: string;
      mentions?: string[];
    },
  ) {
    try {
      if (!client.user) {
        client.emit('socketError', { message: 'Belum terautentikasi' });
        return;
      }

      const { groupId, content, mentions } = payload || {};
      if (!groupId || !content) {
        client.emit('socketError', {
          message: 'groupId dan content pesan wajib diisi',
        });
        return;
      }

      // Save message to database first (as strictly required in PRD Section 11 & 14)
      const savedMessage = await this.messagesService.saveMessage(
        groupId,
        client.user.id,
        content,
        mentions || [],
      );

      // Broadcast to all members currently in the group room
      const roomName = `group:${groupId}`;
      this.server.to(roomName).emit('newMessage', savedMessage);

      // Emit mention alerts to mentioned users
      if (savedMessage.mentions && savedMessage.mentions.length > 0) {
        for (const mention of savedMessage.mentions) {
          this.server.to(`user:${mention.mentioned_user_id}`).emit('mention', {
            messageId: savedMessage.id,
            groupId,
            sender: savedMessage.sender,
            content: savedMessage.content,
            created_at: savedMessage.created_at,
          });
        }
      }
    } catch (error: any) {
      this.logger.error(`Error saving/broadcasting message: ${error.message}`);
      client.emit('socketError', {
        message: error.message || 'Gagal mengirim pesan',
      });
    }
  }
}
