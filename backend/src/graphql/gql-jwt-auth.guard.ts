import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * GraphQL variant of the HTTP JWT guard. The base @nestjs/passport guard
 * calls `context.switchToHttp().getRequest()`, which returns the resolver's
 * root value (undefined) in a GraphQL context. This explicitly reads the
 * underlying express request from the GraphQL context instead.
 */
@Injectable()
export class GqlJwtAuthGuard extends JwtAuthGuard {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}