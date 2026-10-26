import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class SocialAuthDto {
  @ApiProperty({
    description: 'Social auth provider',
    enum: ['google', 'apple'],
    example: 'google',
  })
  @IsEnum(['google', 'apple'])
  @IsNotEmpty()
  provider: 'google' | 'apple';

  @ApiProperty({
    description: 'OAuth access token from the provider',
    example: 'ya29.a0AfH6SMB...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
