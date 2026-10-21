import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { InviteLink } from '../entities/invite-link.entity';
import { User } from '../entities/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
    @InjectRepository(InviteLink)
    private readonly inviteRepository: Repository<InviteLink>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Nama grup tidak boleh kosong');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const group = queryRunner.manager.create(Group, {
        name: trimmedName,
        created_by: userId,
      });
      const savedGroup = await queryRunner.manager.save(group);

      const membership = queryRunner.manager.create(GroupMember, {
        group_id: savedGroup.id,
        user_id: userId,
        role: 'admin',
      });
      await queryRunner.manager.save(membership);

      await queryRunner.commitTransaction();

      return {
        message: 'Grup berhasil dibuat',
        data: {
          id: savedGroup.id,
          name: savedGroup.name,
          created_by: savedGroup.created_by,
          role: 'admin',
          created_at: savedGroup.created_at,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserGroups(userId: string) {
    const memberships = await this.memberRepository.find({
      where: { user_id: userId },
      relations: ['group', 'group.creator'],
      order: { joined_at: 'DESC' },
    });

    const groupIds = memberships.map((m) => m.group_id);

    // Get member count per group
    let countMap: Record<string, number> = {};
    if (groupIds.length > 0) {
      const counts = await this.memberRepository
        .createQueryBuilder('m')
        .select('m.group_id', 'groupId')
        .addSelect('COUNT(m.id)', 'count')
        .where('m.group_id IN (:...groupIds)', { groupIds })
        .groupBy('m.group_id')
        .getRawMany();

      for (const c of counts) {
        countMap[c.groupId] = parseInt(c.count, 10);
      }
    }

    const data = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      created_by: m.group.created_by,
      creator_name: m.group.creator?.display_name || 'Unknown',
      role: m.role,
      joined_at: m.joined_at,
      member_count: countMap[m.group_id] || 1,
      created_at: m.group.created_at,
    }));

    return {
      message: 'Daftar grup berhasil diambil',
      data,
    };
  }

  async getGroupDetails(groupId: string, userId: string) {
    const membership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('Anda bukan anggota grup ini');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['creator'],
    });

    if (!group) {
      throw new NotFoundException('Grup tidak ditemukan');
    }

    const memberCount = await this.memberRepository.count({
      where: { group_id: groupId },
    });

    return {
      message: 'Detail grup berhasil diambil',
      data: {
        id: group.id,
        name: group.name,
        created_by: group.created_by,
        creator: {
          id: group.creator?.id,
          username: group.creator?.username,
          display_name: group.creator?.display_name,
        },
        my_role: membership.role,
        member_count: memberCount,
        created_at: group.created_at,
        updated_at: group.updated_at,
      },
    };
  }

  async updateGroupName(groupId: string, userId: string, dto: UpdateGroupDto) {
    const membership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('Anda bukan anggota grup ini');
    }

    if (membership.role !== 'admin') {
      throw new ForbiddenException('Hanya admin grup yang dapat mengubah nama grup');
    }

    const trimmed = dto.name.trim();
    if (!trimmed) {
      throw new BadRequestException('Nama grup tidak boleh kosong');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grup tidak ditemukan');
    }

    group.name = trimmed;
    const updated = await this.groupRepository.save(group);

    return {
      message: 'Nama grup berhasil diperbarui',
      data: updated,
    };
  }

  async getGroupMembers(groupId: string, userId: string) {
    const membership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('Anda bukan anggota grup ini');
    }

    const members = await this.memberRepository.find({
      where: { group_id: groupId },
      relations: ['user'],
      order: { role: 'ASC', joined_at: 'ASC' }, // 'admin' comes before 'member' alphabetically
    });

    const data = members.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      user: {
        id: m.user.id,
        username: m.user.username,
        display_name: m.user.display_name,
        bio: m.user.bio,
      },
    }));

    return {
      message: 'Daftar anggota grup berhasil diambil',
      data,
    };
  }

  async changeMemberRole(
    groupId: string,
    adminUserId: string,
    targetUserId: string,
    dto: ChangeRoleDto,
  ) {
    // 1. Check if caller is admin
    const callerMembership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: adminUserId },
    });

    if (!callerMembership || callerMembership.role !== 'admin') {
      throw new ForbiddenException('Hanya admin grup yang dapat mengubah role anggota');
    }

    // 2. Check if target user is in this group
    const targetMembership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: targetUserId },
      relations: ['user'],
    });

    if (!targetMembership) {
      throw new NotFoundException('Anggota tidak ditemukan dalam grup ini');
    }

    targetMembership.role = dto.role;
    const updated = await this.memberRepository.save(targetMembership);

    return {
      message: `Role pengguna berhasil diubah menjadi ${dto.role}`,
      data: {
        id: updated.id,
        user_id: updated.user_id,
        role: updated.role,
        user: {
          id: targetMembership.user.id,
          username: targetMembership.user.username,
          display_name: targetMembership.user.display_name,
        },
      },
    };
  }

  async createInviteLink(groupId: string, adminUserId: string, dto: CreateInviteDto) {
    const callerMembership = await this.memberRepository.findOne({
      where: { group_id: groupId, user_id: adminUserId },
    });

    if (!callerMembership || callerMembership.role !== 'admin') {
      throw new ForbiddenException('Hanya admin grup yang dapat membuat link undangan');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grup tidak ditemukan');
    }

    // Generate random secure code
    const code = crypto.randomBytes(6).toString('hex'); // 12-char hex string

    let expires_at: Date | null = null;
    if (dto.expires_in_hours && dto.expires_in_hours > 0) {
      expires_at = new Date(Date.now() + dto.expires_in_hours * 60 * 60 * 1000);
    }

    const invite = this.inviteRepository.create({
      group_id: groupId,
      code,
      created_by: adminUserId,
      is_active: true,
      expires_at,
    });

    const saved = await this.inviteRepository.save(invite);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const invite_url = `${frontendUrl}/invite/${code}`;

    return {
      message: 'Link undangan berhasil dibuat',
      data: {
        id: saved.id,
        group_id: saved.group_id,
        code: saved.code,
        is_active: saved.is_active,
        expires_at: saved.expires_at,
        created_at: saved.created_at,
        invite_url,
      },
    };
  }

  async getInviteInfo(code: string) {
    const invite = await this.inviteRepository.findOne({
      where: { code },
      relations: ['group', 'creator'],
    });

    if (!invite) {
      throw new NotFoundException('Link undangan tidak ditemukan');
    }

    const now = new Date();
    const isExpired = invite.expires_at ? new Date(invite.expires_at) < now : false;
    const isValid = invite.is_active && !isExpired;

    const memberCount = await this.memberRepository.count({
      where: { group_id: invite.group_id },
    });

    return {
      message: 'Informasi undangan grup',
      data: {
        code: invite.code,
        group_id: invite.group_id,
        group_name: invite.group?.name,
        creator_name: invite.creator?.display_name || 'Admin',
        member_count: memberCount,
        is_active: invite.is_active,
        is_expired: isExpired,
        is_valid: isValid,
        expires_at: invite.expires_at,
      },
    };
  }

  async joinGroupViaInvite(code: string, userId: string) {
    const invite = await this.inviteRepository.findOne({
      where: { code },
      relations: ['group'],
    });

    if (!invite) {
      throw new NotFoundException('Link undangan tidak ditemukan');
    }

    if (!invite.is_active) {
      throw new BadRequestException('Link undangan sudah dinonaktifkan');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException('Link undangan sudah kedaluwarsa');
    }

    // Check if user is already a member (idempotency, prevent duplicate membership)
    const existingMembership = await this.memberRepository.findOne({
      where: { group_id: invite.group_id, user_id: userId },
    });

    if (existingMembership) {
      return {
        message: 'Anda sudah menjadi anggota grup ini',
        data: {
          group_id: invite.group_id,
          group_name: invite.group.name,
          role: existingMembership.role,
          is_already_member: true,
        },
      };
    }

    // Add user as regular member
    const newMember = this.memberRepository.create({
      group_id: invite.group_id,
      user_id: userId,
      role: 'member',
    });

    await this.memberRepository.save(newMember);

    return {
      message: 'Berhasil bergabung ke dalam grup',
      data: {
        group_id: invite.group_id,
        group_name: invite.group.name,
        role: 'member',
        is_already_member: false,
      },
    };
  }

  async checkMembership(groupId: string, userId: string): Promise<GroupMember | null> {
    return this.memberRepository.findOne({
      where: { group_id: groupId, user_id: userId },
    });
  }
}
