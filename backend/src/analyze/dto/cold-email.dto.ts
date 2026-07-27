import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ColdEmailDto {
  @ApiProperty({ example: 'Senior Backend Engineer at Google' })
  @IsString()
  role!: string;

  @ApiProperty({ example: 'We are looking for a backend engineer...' })
  @IsString()
  jobDescription!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  userName!: string;
}
