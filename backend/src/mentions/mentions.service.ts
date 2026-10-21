import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mention } from '../entities/mention.entity';

@Injectable()
export class MentionsService {
  constructor(
    @InjectRepository(Mention)
    private readonly mentionRepository: Repository<Mention>,
  ) {}

  async getUserMentions(userId: string) {
    const mentions = await this.mentionRepository.find({
      where: { mentioned_user_id: userId },
      relations: [
        'message',
        'message.sender',
        'message.group',
      ],
      order: { created_at: 'DESC' },
      take: 50,
    });

    const data = mentions.map((m) => ({
      id: m.id,
      is_read: m.is_read,
      created_at: m.created_at,
      message: {
        id: m.message?.id,
        content: m.message?.content,
        created_at: m.message?.created_at,
        sender: {
          id: m.message?.sender?.id,
          username: m.message?.sender?.username,
          display_name: m.message?.sender?.display_name,
        },
      },
      group: {
        id: m.message?.group?.id,
        name: m.message?.group?.name,
      },
    }));

    return {
      message: 'Daftar mention berhasil diambil',
      data,
    };
  }

  async markAsRead(mentionId: string, userId: string) {
    const mention = await this.mentionRepository.findOne({
      where: { id: mentionId },
    });

    if (!mention) {
      throw new NotFoundException('Mention tidak ditemukan');
    }

    if (mention.mentioned_user_id !== userId) {
      throw new ForbiddenException('Akses ditolak: ini bukan mention Anda');
    }

    mention.is_read = true;
    const updated = await this.mentionRepository.save(mention);

    return {
      message: 'Mention berhasil ditandai telah dibaca',
      data: updated,
    };
  }
}
