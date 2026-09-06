import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class JobAnalysis {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  matchScore!: number;

  @Field(() => [String])
  matchedSkills!: string[];

  @Field(() => [String])
  missingSkills!: string[];

  @Field(() => [String])
  suggestions!: string[];

  @Field()
  summary!: string;

  @Field()
  jobDescription!: string;

  @Field(() => String, { nullable: true })
  coldEmail?: string | null;

  @Field(() => ID)
  userId!: string;

  @Field()
  createdAt!: Date;
}