import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { LimitRateService } from '../service/limit-rate.service';

@Injectable()
export class GetDataGuard implements CanActivate {
  constructor(private readonly limitRateService: LimitRateService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.query.user;
    if (!user) {
      throw new HttpException('Parameter: user should not be empty.', HttpStatus.BAD_REQUEST);
    }
    let limitRes: { can: boolean; ip: number; id: number };
    try {
      limitRes = await this.limitRateService.consume(request.ip, user);
    } catch (e) {
      throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!limitRes.can) {
      throw new HttpException(
        {
          ip: limitRes.ip,
          id: limitRes.id,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
