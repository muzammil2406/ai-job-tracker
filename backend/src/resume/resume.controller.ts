import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResumeService } from './resume.service';
import { SaveResumeDto } from './dto/save-resume.dto';

@ApiTags('Resume')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resume')
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  @Post('save')
  @ApiOperation({ summary: 'Save a resume version' })
  save(@Body() dto: SaveResumeDto, @Req() req: any) {
    return this.resumeService.save(req.user.id, dto.label, dto.content);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get all saved resume versions' })
  findAll(@Req() req: any) {
    return this.resumeService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume version' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.resumeService.remove(req.user.id, id);
  }
}
