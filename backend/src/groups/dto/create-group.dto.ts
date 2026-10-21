import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateGroupDto {
  @IsString({ message: 'Nama grup harus berupa string' })
  @IsNotEmpty({ message: 'Nama grup tidak boleh kosong' })
  @Length(1, 100, { message: 'Nama grup maksimal 100 karakter' })
  name: string;
}
