import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Username atau email harus berupa string' })
  @IsNotEmpty({ message: 'Username atau email wajib diisi' })
  identifier: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password: string;
}
