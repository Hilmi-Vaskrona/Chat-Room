import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':id/messages')
  async getGroupMessages(
    @Param('id', new ParseUUIDPipe()) groupId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.getGroupMessages(
      groupId,
      user.id,
      parsedLimit,
      before,
    );
  }
}
