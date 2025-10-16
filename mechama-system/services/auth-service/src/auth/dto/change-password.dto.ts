import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Senha atual deve ser uma string' })
  currentPassword: string;

  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  newPassword: string;
}