import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { User } from '../entities/user.entity';
import { AddContactDto } from './dto/add-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getContacts(ownerId: string) {
    const contacts = await this.contactRepository.find({
      where: { owner_id: ownerId },
      relations: ['contact_user'],
      order: { created_at: 'DESC' },
    });

    const formatted = contacts.map((c) => ({
      id: c.id,
      contact_user_id: c.contact_user_id,
      created_at: c.created_at,
      user: {
        id: c.contact_user.id,
        username: c.contact_user.username,
        display_name: c.contact_user.display_name,
        bio: c.contact_user.bio,
      },
    }));

    return {
      message: 'Daftar kontak berhasil diambil',
      data: formatted,
    };
  }

  async addContact(ownerId: string, dto: AddContactDto) {
    const targetUsername = dto.username.trim().toLowerCase();

    const targetUser = await this.userRepository.findOne({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(`Pengguna dengan username "${dto.username}" tidak ditemukan`);
    }

    if (targetUser.id === ownerId) {
      throw new BadRequestException('Anda tidak dapat menambahkan diri sendiri sebagai kontak');
    }

    const existingContact = await this.contactRepository.findOne({
      where: {
        owner_id: ownerId,
        contact_user_id: targetUser.id,
      },
    });

    if (existingContact) {
      throw new ConflictException('Pengguna ini sudah ada dalam kontak Anda');
    }

    const contact = this.contactRepository.create({
      owner_id: ownerId,
      contact_user_id: targetUser.id,
    });

    const saved = await this.contactRepository.save(contact);

    return {
      message: 'Kontak berhasil ditambahkan',
      data: {
        id: saved.id,
        contact_user_id: targetUser.id,
        created_at: saved.created_at,
        user: {
          id: targetUser.id,
          username: targetUser.username,
          display_name: targetUser.display_name,
          bio: targetUser.bio,
        },
      },
    };
  }

  async removeContact(ownerId: string, contactId: string) {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, owner_id: ownerId },
    });
    if (!contact) {
      throw new NotFoundException('Kontak tidak ditemukan');
    }
    await this.contactRepository.remove(contact);
    return {
      message: 'Kontak berhasil dihapus',
      data: null,
    };
  }
}
