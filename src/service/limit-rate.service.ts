import { Injectable } from '@nestjs/common';

import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class LimitRateService {
  private readonly LIMIT_RATE_IP_KEY = 'limit_rate_ip';
  private readonly LIMIT_RATE_ID_KEY = 'limit_rate_id';

  constructor(private readonly redisService: RedisService) {}

  async consume(ip: string, id: number): Promise<{ can: boolean; ip: number; id: number }> {
    const client = this.redisService.getClient();
    const script = `
      local ipKey = KEYS[1]
      local idKey = KEYS[2]
      
      local function consume(key)
        local exist = redis.call('EXISTS', key)
        local ttl = redis.call('TTL', key)
        local result
        if not exist then
          result = redis.call('INCR', key)
          redis.call('EXPIRE', key, 60)
        else
          if ttl <= 0 then
            redis.call('del', key)
            ttl = 60
          end
          result = redis.call('INCR', key)
          redis.call('EXPIRE', key, ttl)
        end
        
        return result
      end
      
      local ip = consume(ipKey)
      local id = consume(idKey)
      
      return cjson.encode({
        ip=ip,
        id=id
      })
    `;

    const ipKey = `${this.LIMIT_RATE_IP_KEY}_${ip}`;
    const idKey = `${this.LIMIT_RATE_ID_KEY}_${id}`;

    //eval(script: string | Buffer, numkeys: number | string, callback?: Callback<unknown>): Result<unknown, Context>;
    const jsonData: string = (await client.eval(script, 2, ipKey, idKey)) as string;

    const parseData: {
      ip: number;
      id: number;
    } = JSON.parse(jsonData);

    const res: { can: boolean; ip: number; id: number } = {
      can: true,
      ip: parseData.ip,
      id: parseData.id,
    };

    if (res.ip > 10) {
      res.can = false;
    }
    if (res.id > 5) {
      res.can = false;
    }

    return res;
  }
}
