import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeService } from '../analyze/analyze.service';
import { Resume } from './models/resume.type';
import { JobAnalysis } from './models/job-analysis.type';
import { MatchHistory, ResumeHistoryPage } from './models/match-history.type';
import { AnalyzeResumeInput } from './dto/analyze-resume.input';

export interface GraphQLRequest {
  headers: Record<string, string>;
  user?: { id: string; email: string };
}

@Resolver(() => MatchHistory)
export class GraphqlResolver {
  constructor(
    private prisma: PrismaService,
    private analyzeService: AnalyzeService,
  ) {}

  @Query(() => ResumeHistoryPage)
  @UseGuards(JwtAuthGuard)
  async resumeHistory(
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
    @Context() ctx: { req: GraphQLRequest },
  ) {
    const userId = ctx.req.user!.id;
    page = Math.max(1, page);
    pageSize = Math.min(50, Math.max(1, pageSize));

    const where = { userId };

    const total = await this.prisma.resume.count({ where });
    const resumes = (await this.prisma.resume.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })) as Resume[];
    type AnalysisWithResumeId = JobAnalysis & { resumeId: string | null };
    const analyses = (await this.prisma.analysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })) as AnalysisWithResumeId[];

    const analysisByResumeId = new Map<string, AnalysisWithResumeId>();
    for (const a of analyses) {
      if (a.resumeId && !analysisByResumeId.has(a.resumeId)) {
        analysisByResumeId.set(a.resumeId, a);
      }
    }

    const items: MatchHistory[] = resumes.map((r) => {
      const analysis = analysisByResumeId.get(r.id);
      return {
        id: r.id,
        resume: r,
        analysis: analysis ?? null,
        resumeId: r.id,
        matchScore: analysis?.matchScore ?? null,
        createdAt: r.createdAt,
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page * pageSize < total,
    };
  }

  @Query(() => JobAnalysis)
  @UseGuards(JwtAuthGuard)
  async jobMatch(@Args('id') id: string, @Context() ctx: { req: GraphQLRequest }) {
    const userId = ctx.req.user!.id;
    return this.prisma.analysis.findFirstOrThrow({
      where: { id, userId },
    });
  }

  @Mutation(() => JobAnalysis)
  @UseGuards(JwtAuthGuard)
  async analyzeResume(
    @Args('input') input: AnalyzeResumeInput,
    @Context() ctx: { req: GraphQLRequest },
  ) {
    const userId = ctx.req.user!.id;
    const resume = await this.prisma.resume.create({
      data: {
        label: 'Auto-uploaded resume',
        content: input.resumeText,
        userId,
      },
    });
    const result = await this.analyzeService.analyzeResume(
      userId,
      input.resumeText,
      input.jobDescription,
      { resumeId: resume.id },
    );
    return result;
  }

  @ResolveField(() => Resume, { nullable: true })
  async resume(@Parent() history: MatchHistory) {
    return this.prisma.resume.findUnique({ where: { id: history.id } });
  }
}