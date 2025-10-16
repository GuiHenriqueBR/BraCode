import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'Senha deve ser uma string' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Código 2FA deve ser uma string' })
  twoFactorCode?: string;
}