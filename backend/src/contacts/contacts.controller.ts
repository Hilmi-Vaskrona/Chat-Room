import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { AddContactDto } from './dto/add-contact.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async getContacts(@CurrentUser() user: CurrentUserPayload) {
    return this.contactsService.getContacts(user.id);
  }

  @Post()
  async addContact(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddContactDto,
  ) {
    return this.contactsService.addContact(user.id, dto);
  }

  @Delete(':id')
  async removeContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.contactsService.removeContact(user.id, id);
  }
}
