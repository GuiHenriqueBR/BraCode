import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@mechama/types';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;

  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  firstName: string;

  @IsString({ message: 'Sobrenome deve ser uma string' })
  @MinLength(2, { message: 'Sobrenome deve ter pelo menos 2 caracteres' })
  lastName: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  phone?: string;

  @IsEnum(UserRole, { message: 'Tipo de usuário inválido' })
  role: UserRole;
}