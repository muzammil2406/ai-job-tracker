import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveResumeDto {
  @ApiProperty({ example: 'Backend v1' })
  @IsString()
  label!: string;

  @ApiProperty({ example: 'Full resume text content...' })
  @IsString()
  content!: string;
}
