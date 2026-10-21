import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('invite')
export class InviteController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get(':code')
  async getInviteInfo(@Param('code') code: string) {
    return this.groupsService.getInviteInfo(code);
  }

  @Post(':code/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(
    @Param('code') code: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.groupsService.joinGroupViaInvite(code, user.id);
  }
}
