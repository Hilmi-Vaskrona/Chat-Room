import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MentionsService } from './mentions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('mentions')
@UseGuards(JwtAuthGuard)
export class MentionsController {
  constructor(private readonly mentionsService: MentionsService) {}

  @Get()
  async getUserMentions(@CurrentUser() user: CurrentUserPayload) {
    return this.mentionsService.getUserMentions(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.mentionsService.markAsRead(id, user.id);
  }
}
