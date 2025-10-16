import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token deve ser uma string' })
  token: string;

  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  newPassword: string;
}