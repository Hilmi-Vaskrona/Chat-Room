import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async createGroup(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(user.id, dto);
  }

  @Get()
  async getUserGroups(@CurrentUser() user: CurrentUserPayload) {
    return this.groupsService.getUserGroups(user.id);
  }

  @Get(':id')
  async getGroupDetails(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.groupsService.getGroupDetails(id, user.id);
  }

  @Patch(':id')
  async updateGroupName(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroupName(id, user.id, dto);
  }

  @Get(':id/members')
  async getGroupMembers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.groupsService.getGroupMembers(id, user.id);
  }

  @Patch(':id/members/:userId/role')
  async changeMemberRole(
    @Param('id', new ParseUUIDPipe()) groupId: string,
    @Param('userId', new ParseUUIDPipe()) targetUserId: string,
    @CurrentUser() adminUser: CurrentUserPayload,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.groupsService.changeMemberRole(
      groupId,
      adminUser.id,
      targetUserId,
      dto,
    );
  }

  @Post(':id/invite')
  async createInvite(
    @Param('id', new ParseUUIDPipe()) groupId: string,
    @CurrentUser() adminUser: CurrentUserPayload,
    @Body() dto: CreateInviteDto,
  ) {
    return this.groupsService.createInviteLink(groupId, adminUser.id, dto);
  }
}
