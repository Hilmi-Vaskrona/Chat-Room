import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }
    return {
      message: 'Profil pengguna berhasil diambil',
      data: user,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    if (dto.display_name !== undefined) {
      const trimmed = dto.display_name.trim();
      if (!trimmed) {
        throw new BadRequestException('Nama tampilan tidak boleh kosong');
      }
      user.display_name = trimmed;
    }

    if (dto.bio !== undefined) {
      user.bio = dto.bio;
    }

    const updated = await this.userRepository.save(user);

    return {
      message: 'Profil berhasil diperbarui',
      data: updated,
    };
  }

  async searchByUsername(query: string, currentUserId: string) {
    if (!query || !query.trim()) {
      return {
        message: 'Hasil pencarian pengguna',
        data: [],
      };
    }

    const normalized = query.trim().toLowerCase();

    // Find users whose username starts with or contains query (exclude current user)
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE :query', { query: `%${normalized}%` })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .take(20)
      .getMany();

    return {
      message: 'Hasil pencarian pengguna',
      data: users,
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }
    return {
      message: 'Data pengguna ditemukan',
      data: user,
    };
  }
}
