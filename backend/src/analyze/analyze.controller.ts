import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyzeService } from './analyze.service';
import { PrismaService } from '../prisma/prisma.service';
import { ColdEmailDto } from './dto/cold-email.dto';
import pdfParse from 'pdf-parse';

@ApiTags('Analyze')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analyze')
export class AnalyzeController {
  constructor(
    private analyzeService: AnalyzeService,
    private prisma: PrismaService,
  ) {}

  @Post('resume')
  @UseInterceptors(FileInterceptor('resume'))
  @ApiOperation({ summary: 'Upload resume PDF and analyze against job description' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resume: { type: 'string', format: 'binary' },
        jobDescription: { type: 'string' },
      },
    },
  })
  async analyzeResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Resume PDF is required');
    if (!jobDescription) throw new BadRequestException('Job description is required');

    const pdfData = await pdfParse(file.buffer);
    const resumeText = pdfData.text;

    const resume = await this.prisma.resume.create({
      data: {
        label: file.originalname || 'Auto-uploaded resume',
        content: resumeText,
        userId: req.user.id,
      },
    });

    try {
      return await this.analyzeService.analyzeResume(
        req.user.id,
        resumeText,
        jobDescription,
        { resumeId: resume.id },
      );
    } catch (err) {
      await this.prisma.resume.delete({ where: { id: resume.id } }).catch(() => undefined);
      throw err;
    }
  }

  @Post('cold-email')
  @ApiOperation({ summary: 'Generate a cold outreach email' })
  async generateColdEmail(@Body() dto: ColdEmailDto, @Req() req: any) {
    return this.analyzeService.generateColdEmail(
      req.user.id,
      dto.role,
      dto.jobDescription,
      dto.userName,
    );
  }
}
