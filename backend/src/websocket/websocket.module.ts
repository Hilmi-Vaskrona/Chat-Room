import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [ConfigModule, JwtModule, MessagesModule, GroupsModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class WebsocketModule {}
