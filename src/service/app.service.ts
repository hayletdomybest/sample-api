import { HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { clearInterval } from 'timers';

import { RedisService } from '@liaoliaots/nestjs-redis';
import axios from 'axios';
import { last } from 'lodash';
import { WebSocket } from 'ws';

import { OHLC } from '../model/app.service.model';
import { BitstampWsEventTradeMetadata, BitstampWsResponse } from '../model/bitstamp.ws.model';
import { groupBy, timeRoundToNearest1Minute } from '../utils';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly DATA_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty';
  private readonly STREAMING_URL = 'wss://ws.bitstamp.net';
  private readonly BITSTAMP_TRADE_REDIS_KEY = 'bitstamp_trades';

  private socket: WebSocket;
  private interval: any;
  private readonly eventEmitter = new EventEmitter();
  private readonly OHLC_EVENT = 'OHLC_EVENT';

  private readonly CURRENCY_PARIS = [
    'btcusd',
    'btceur',
    'ltcusd',
    'ethusd',
    'xrpusd',
    'usdcusd',
    'algousd',
    'uniusd',
    'zrxusd',
    'linkusd',
  ];

  constructor(private readonly redisService: RedisService) {}

  async getData(num: number): Promise<number[]> {
    const res = await axios.get(this.DATA_URL);
    if (res.status !== HttpStatus.OK) {
      throw new Error('API Error');
    }

    const data: number[] = res.data;

    return data.filter((d) => d % num === 0);
  }

  async getAll(): Promise<{ [symbol: string]: OHLC[] }> {
    const res: { [symbol: string]: OHLC[] } = {};
    for (const currency of this.CURRENCY_PARIS) {
      const data = await this.getOHLC(currency);
      res[currency] = data;
    }
    return res;
  }

  subscribe(listen: (data: { [symbol: string]: OHLC[] }) => any): void {
    this.eventEmitter.on(this.OHLC_EVENT, listen);
  }

  private subscribeData(): void {
    this.socket.on('message', async (rowData) => {
      const pareData: BitstampWsResponse<any> = JSON.parse(rowData.toString());
      if (pareData.event !== 'trade') return;
      const tradeData = (pareData as BitstampWsResponse<BitstampWsEventTradeMetadata>).data;
      const symbol = last(pareData.channel.split('_'));
      await this.storeTradeToRedis(symbol, tradeData);
      const _data = await this.getOHLC(symbol);

      this.eventEmitter.emit(this.OHLC_EVENT, _data);
    });

    const channelNames = this.CURRENCY_PARIS.map((s) => `live_trades_${s}`);
    channelNames.forEach((channel) => {
      this.socket.send(
        JSON.stringify({
          event: 'bts:subscribe',
          data: {
            channel: channel,
          },
        }),
      );
    });
  }

  private async connectBitstampWs(): Promise<any> {
    this.socket = new WebSocket(this.STREAMING_URL);
    await new Promise((r, j) => {
      const timeoutId = setTimeout(() => {
        j(new Error('ws connect timeout'));
      }, 30000);

      this.socket.on('open', () => {
        r('ok');
        clearTimeout(timeoutId);
      });

      this.socket.on('error', (err) => {
        j(err);
        clearTimeout(timeoutId);
      });
    });
  }

  private async storeTradeToRedis(
    symbol: string,
    ...trades: BitstampWsEventTradeMetadata[]
  ): Promise<void> {
    if (!trades.length) return;
    const key = this.getTradeKey(symbol);
    try {
      const pipeline = this.redisService.getClient().pipeline();

      for (const trade of trades) {
        const score = this.getTimestamp(trade);
        const value = JSON.stringify(trade);

        pipeline.zadd(key, score, value);
      }

      await pipeline.exec();
    } catch (e) {
      console.error('storeTradeToRedis error: %o', e);
    }
  }

  private async getOHLC(symbol: string): Promise<OHLC[]> {
    const key = this.getTradeKey(symbol);
    const client = this.redisService.getClient();
    const dataStr: string[] = await client.zrange(key, 0, -1);
    const trades: BitstampWsEventTradeMetadata[] = dataStr.map((data) => JSON.parse(data));
    const group = groupBy(
      trades,
      (k) => timeRoundToNearest1Minute(this.getTimestamp(k)),
      (v) => v,
      'record',
    );

    const res: OHLC[] = [];
    for (const timestamp of Object.keys(group)) {
      let _trades: BitstampWsEventTradeMetadata[] = group[timestamp];
      _trades = _trades.sort((a, b) => this.getTimestamp(a) - this.getTimestamp(b));
      const open = _trades[0].price;
      let high = _trades[0].price;
      let low = _trades[0].price;
      const close = _trades[_trades.length - 1].price;

      _trades.forEach((trade) => {
        if (trade.price > high) high = trade.price;
        if (trade.price < low) low = trade.price;
      });

      res.push({
        open,
        high,
        low,
        close,
        timestamp: Number(timestamp),
      });
    }

    return res.sort((a, b) => a.timestamp - b.timestamp);
  }

  private async pruneTrade(): Promise<void> {
    const now = new Date().getTime();
    const deadline = now - 15 * 60 * 1000;
    const keys = this.CURRENCY_PARIS.map((c) => this.getTradeKey(c));
    const client = this.redisService.getClient().pipeline();
    try {
      for (const key of keys) {
        client.zremrangebyscore(key, '-inf', deadline.toString());
      }
      await client.exec();
    } catch (e) {
      console.error('pruneTrade error:%o', e);
    }
  }

  private getTradeKey(symbol): string {
    return `${this.BITSTAMP_TRADE_REDIS_KEY}_${symbol}`;
  }

  private getTimestamp(trade: BitstampWsEventTradeMetadata): number {
    return Number(trade.timestamp) * 1000;
  }

  async onModuleInit(): Promise<void> {
    this.interval = setInterval(() => this.pruneTrade(), 15 * 60 * 1000);
    await this.connectBitstampWs();
    this.subscribeData();
  }

  onModuleDestroy(): any {
    clearInterval(this.interval);
  }
}
