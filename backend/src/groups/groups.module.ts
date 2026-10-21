import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { InviteController } from './invite.controller';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { InviteLink } from '../entities/invite-link.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupMember, InviteLink, User])],
  controllers: [GroupsController, InviteController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
