import { IsIn, IsNotEmpty } from 'class-validator';

export class ChangeRoleDto {
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  @IsIn(['admin', 'member'], { message: 'Role harus "admin" atau "member"' })
  role: 'admin' | 'member';
}
