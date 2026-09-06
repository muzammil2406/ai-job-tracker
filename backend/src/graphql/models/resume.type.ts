import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Resume {
  @Field(() => ID)
  id!: string;

  @Field()
  label!: string;

  @Field()
  content!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  createdAt!: Date;
}