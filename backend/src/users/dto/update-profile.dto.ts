import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Nama tampilan harus berupa string' })
  @Length(1, 80, { message: 'Nama tampilan maksimal 80 karakter' })
  display_name?: string;

  @IsOptional()
  @IsString({ message: 'Bio harus berupa string' })
  @Length(0, 500, { message: 'Bio maksimal 500 karakter' })
  bio?: string;
}
