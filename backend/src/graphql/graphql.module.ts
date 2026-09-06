import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AnalyzeModule } from '../analyze/analyze.module';
import { GraphqlResolver } from './graphql.resolver';

export interface GraphQLContextUser {
  id: string;
  email: string;
}

export interface GraphQLContext {
  req: import('express').Request;
  user?: GraphQLContextUser;
}

@Module({
  imports: [
    AnalyzeModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService, JwtService],
      useFactory: (config: ConfigService, jwt: JwtService) => ({
        autoSchemaFile: process.env.NODE_ENV === 'production' ? true : 'schema.gql',
        path: 'graphql',
        playground: config.get<string>('NODE_ENV') !== 'production',
        context: (ctx: { req: import('express').Request }): GraphQLContext => {
          const header =
            (ctx.req.headers.authorization as string | undefined) ?? '';
          const token = header.startsWith('Bearer ')
            ? header.slice('Bearer '.length)
            : null;

          let user: GraphQLContextUser | undefined;
          if (token) {
            const secret = config.get<string>('JWT_SECRET');
            try {
              const payload = jwt.verify<{ sub: string; email: string }>(token, {
                secret,
              });
              user = { id: payload.sub, email: payload.email };
            } catch {
              user = undefined;
            }
          }

          return { ...ctx, user };
        },
      }),
    }),
  ],
  providers: [GraphqlResolver],
})
export class GraphqlModule {}