import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class AnalyzeResumeInput {
  @Field()
  @IsString()
  @MinLength(10)
  resumeText!: string;

  @Field()
  @IsString()
  @MinLength(10)
  jobDescription!: string;
}