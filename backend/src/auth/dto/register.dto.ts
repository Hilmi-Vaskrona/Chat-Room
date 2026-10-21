import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @Length(3, 30, { message: 'Username harus berukuran 3-30 karakter' })
  @Matches(/^\S+$/, { message: 'Username tidak boleh mengandung spasi' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username hanya boleh mengandung huruf, angka, underscore, titik, atau strip',
  })
  username: string;

  @IsString({ message: 'Display name harus berupa string' })
  @IsNotEmpty({ message: 'Nama tampilan tidak boleh kosong' })
  @Length(1, 80, { message: 'Nama tampilan maksimal 80 karakter' })
  display_name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @Length(6, 100, { message: 'Password minimal 6 karakter' })
  password: string;
}
