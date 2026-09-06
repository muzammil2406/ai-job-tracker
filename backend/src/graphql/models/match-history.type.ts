import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Resume } from './resume.type';
import { JobAnalysis } from './job-analysis.type';

@ObjectType()
export class MatchHistory {
  @Field(() => ID)
  id!: string;

  @Field(() => Resume, { nullable: true })
  resume?: Resume | null;

  @Field(() => JobAnalysis, { nullable: true })
  analysis?: JobAnalysis | null;

  @Field(() => String, { nullable: true })
  resumeId?: string | null;

  @Field(() => Int, { nullable: true })
  matchScore?: number | null;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class ResumeHistoryPage {
  @Field(() => [MatchHistory])
  items!: MatchHistory[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  pageSize!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field()
  hasNextPage!: boolean;
}