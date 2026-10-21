import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from '../entities/message.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
    @InjectRepository(Mention)
    private readonly mentionRepository: Repository<Mention>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getGroupMessages(
    groupId: string,
    userId: string,
    limit: number = 50,
    before?: string,
  ) {
    // 1. Verify membership
    const membership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('Anda bukan anggota grup ini');
    }

    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.mentions', 'mentions')
      .leftJoinAndSelect('mentions.mentioned_user', 'mentioned_user')
      .where('message.group_id = :groupId', { groupId });

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        query.andWhere('message.created_at < :beforeDate', { beforeDate });
      }
    }

    query.orderBy('message.created_at', 'ASC').take(limit);

    const messages = await query.getMany();

    const formatted = messages.map((m) => ({
      id: m.id,
      group_id: m.group_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      sender: {
        id: m.sender?.id,
        username: m.sender?.username,
        display_name: m.sender?.display_name,
      },
      mentions: (m.mentions || []).map((men) => ({
        id: men.id,
        mentioned_user_id: men.mentioned_user_id,
        username: men.mentioned_user?.username,
        display_name: men.mentioned_user?.display_name,
        is_read: men.is_read,
      })),
    }));

    return {
      message: 'Riwayat pesan berhasil diambil',
      data: formatted,
    };
  }

  async saveMessage(
    groupId: string,
    senderId: string,
    content: string,
    mentionedUserIds: string[] = [],
  ) {
    const trimmed = content ? content.trim() : '';
    if (!trimmed) {
      throw new BadRequestException('Isi pesan tidak boleh kosong');
    }

    if (trimmed.length > 2000) {
      throw new BadRequestException('Panjang pesan maksimal 2.000 karakter');
    }

    // 1. Verify sender membership
    const senderMembership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: senderId },
    });

    if (!senderMembership) {
      throw new ForbiddenException('Hanya anggota grup yang dapat mengirim pesan');
    }

    // 2. Extract or validate mentions
    // Also parse @username in content to find user IDs if needed
    const validatedMentionUserIds: string[] = [];
    const atMatches = trimmed.match(/@([a-zA-Z0-9_.-]+)/g) || [];
    const extractedUsernames = atMatches.map((m) => m.substring(1).toLowerCase());

    // Combine extracted usernames and mentionedUserIds
    if (extractedUsernames.length > 0) {
      for (const uname of extractedUsernames) {
        const u = await this.userRepository.findOne({
          where: { username: uname },
        });
        if (u && !mentionedUserIds.includes(u.id)) {
          mentionedUserIds.push(u.id);
        }
      }
    }

    // Verify all mentioned users are members of this group
    if (mentionedUserIds.length > 0) {
      const groupMembers = await this.memberRepository.find({
        where: { group_id: groupId },
      });
      const memberIds = new Set(groupMembers.map((m) => m.user_id));

      for (const targetId of mentionedUserIds) {
        if (!memberIds.has(targetId)) {
          throw new BadRequestException('Mention hanya diperbolehkan ke sesama anggota grup');
        }
        if (!validatedMentionUserIds.includes(targetId)) {
          validatedMentionUserIds.push(targetId);
        }
      }
    }

    // 3. Save message
    const msg = this.messageRepository.create({
      group_id: groupId,
      sender_id: senderId,
      content: trimmed,
    });

    const savedMsg = await this.messageRepository.save(msg);

    // 4. Save mentions
    const savedMentions: Mention[] = [];
    for (const mUserId of validatedMentionUserIds) {
      const mention = this.mentionRepository.create({
        message_id: savedMsg.id,
        mentioned_user_id: mUserId,
        is_read: false,
      });
      const savedMen = await this.mentionRepository.save(mention);
      savedMentions.push(savedMen);
    }

    // Fetch complete message with relations for broadcast
    const completeMessage = await this.messageRepository.findOne({
      where: { id: savedMsg.id },
      relations: ['sender', 'mentions', 'mentions.mentioned_user'],
    });

    if (!completeMessage) {
      throw new BadRequestException('Gagal memuat pesan yang baru saja disimpan');
    }

    return {
      id: completeMessage.id,
      group_id: completeMessage.group_id,
      sender_id: completeMessage.sender_id,
      content: completeMessage.content,
      created_at: completeMessage.created_at,
      sender: {
        id: completeMessage.sender?.id,
        username: completeMessage.sender?.username,
        display_name: completeMessage.sender?.display_name,
      },
      mentions: (completeMessage.mentions || []).map((men) => ({
        id: men.id,
        mentioned_user_id: men.mentioned_user_id,
        username: men.mentioned_user?.username,
        display_name: men.mentioned_user?.display_name,
        is_read: men.is_read,
      })),
    };
  }
}
