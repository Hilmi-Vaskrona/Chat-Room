import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateInviteDto {
  @IsOptional()
  @IsInt({ message: 'Masa berlaku harus berupa angka jam' })
  @Min(1, { message: 'Masa berlaku minimal 1 jam' })
  expires_in_hours?: number;
}
