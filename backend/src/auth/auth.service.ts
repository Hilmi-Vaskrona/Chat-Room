import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const normalizedUsername = registerDto.username.trim().toLowerCase();
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    // Check unique username
    const existingUsername = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      throw new ConflictException('Username sudah digunakan oleh pengguna lain');
    }

    // Check unique email
    const existingEmail = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(registerDto.password, saltRounds);

    try {
      const newUser = this.userRepository.create({
        username: normalizedUsername,
        display_name: registerDto.display_name.trim(),
        email: normalizedEmail,
        password_hash,
        bio: '',
      });

      const savedUser = await this.userRepository.save(newUser);

      const token = this.generateToken(savedUser);

      return {
        message: 'Registrasi berhasil',
        data: {
          user: {
            id: savedUser.id,
            username: savedUser.username,
            display_name: savedUser.display_name,
            email: savedUser.email,
            bio: savedUser.bio,
            created_at: savedUser.created_at,
          },
          access_token: token,
        },
      };
    } catch (error: any) {
      if (error.code === '23505') {
        // Postgres unique violation
        throw new ConflictException('Username atau email sudah digunakan');
      }
      throw new InternalServerErrorException('Gagal mendaftarkan akun baru');
    }
  }

  async login(loginDto: LoginDto) {
    const identifier = loginDto.identifier.trim().toLowerCase();

    // Query user with password_hash selected
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('LOWER(user.username) = :identifier OR LOWER(user.email) = :identifier', {
        identifier,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Username/email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Username/email atau password salah');
    }

    const token = this.generateToken(user);

    return {
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          email: user.email,
          bio: user.bio,
          created_at: user.created_at,
        },
        access_token: token,
      },
    };
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}
