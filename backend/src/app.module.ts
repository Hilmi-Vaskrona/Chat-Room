import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { GroupsModule } from './groups/groups.module';
import { MessagesModule } from './messages/messages.module';
import { MentionsModule } from './mentions/mentions.module';
import { WebsocketModule } from './websocket/websocket.module';
import {
  User,
  Contact,
  Group,
  GroupMember,
  InviteLink,
  Message,
  Mention,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl =
          configService.get<string>('DATABASE_URL') ||
          'postgresql://postgres:postgres@localhost:5432/chat_room';

        const isSupabaseOrSsl =
          dbUrl.includes('supabase.co') ||
          dbUrl.includes('pooler.supabase.com') ||
          dbUrl.includes('sslmode=require');

        return {
          type: 'postgres',
          url: dbUrl,
          entities: [
            User,
            Contact,
            Group,
            GroupMember,
            InviteLink,
            Message,
            Mention,
          ],
          autoLoadEntities: true,
          synchronize: false, // Disarankan false seperti di PRD agar struktur production aman
          ssl: isSupabaseOrSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuthModule,
    UsersModule,
    ContactsModule,
    GroupsModule,
    MessagesModule,
    MentionsModule,
    WebsocketModule,
  ],
})
export class AppModule {}
