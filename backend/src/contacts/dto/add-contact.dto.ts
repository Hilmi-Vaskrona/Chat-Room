import { IsNotEmpty, IsString } from 'class-validator';

export class AddContactDto {
  @IsString({ message: 'Username kontak harus berupa string' })
  @IsNotEmpty({ message: 'Username kontak tidak boleh kosong' })
  username: string;
}
