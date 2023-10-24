import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { RedisService } from '@liaoliaots/nestjs-redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

@Injectable()
export class GetDataGuard implements CanActivate {
  private readonly rateForIp: RateLimiterRedis;
  private readonly rateForUser: RateLimiterRedis;

  constructor(private readonly redisService: RedisService) {
    this.rateForIp = new RateLimiterRedis({
      storeClient: this.redisService.getClient(),
      points: 10, // Number of points
      duration: 60, // Per second(s)
      blockDuration: 0,
      keyPrefix: `get_data_limit_ip`,
    });

    this.rateForUser = new RateLimiterRedis({
      storeClient: this.redisService.getClient(),
      points: 5, // Number of points
      duration: 60, // Per second(s)
      blockDuration: 0,
      keyPrefix: `get_data_limit_user`,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.query.user;
    if (!user) {
      throw new HttpException('Parameter: user should not be empty.', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.rateForIp.consume(request.ip, 1);
      await this.rateForUser.consume(user, 1);
    } catch (e) {
      throw new HttpException('TOO_MANY_REQUESTS', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
