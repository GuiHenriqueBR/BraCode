import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'abc123def456ghi789',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;
}