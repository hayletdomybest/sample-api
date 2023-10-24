import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncomingMessage } from 'http';

import * as WebSocket from 'ws';

import { GatewayRequestPayload, GatewayResponsePayload, OHLC } from '../model/app.service.model';
import { AppService } from '../service/app.service';

@Injectable()
export class AppWsGateway implements OnModuleInit {
  private wss: WebSocket.Server;
  private readonly subscribeOHLCClients = new Set<WebSocket>();

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.wss = new WebSocket.Server<typeof WebSocket.WebSocket, typeof IncomingMessage>({
      noServer: false,
      port: this.configService.get('WS_PORT') ? Number(this.configService.get('WS_PORT')) : 3001,
      path: '/streaming',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', async (message: string) => {
        const payload = JSON.parse(message);

        switch (payload.eventName) {
          case 'ohlc':
            await this.handleOHLC(ws, payload);
            break;
          default:
            ws.terminate();
            break;
        }
      });

      ws.on('close', () => {
        this.unsubscribeALL(ws);
      });
    });

    this.appService.subscribe((data) => {
      for (const ws of this.subscribeOHLCClients.values()) {
        this.sendOHLC(ws, data);
      }
    });
  }

  private async handleOHLC(ws: WebSocket, payload: GatewayRequestPayload): Promise<void> {
    switch (payload.action) {
      case 'subscribe':
        await this.subscribeOHLC(ws);
        break;
      case 'unsubscribe':
        await this.unsubscribeOHLC(ws);
        break;
      default:
        ws.terminate();
        break;
    }
  }

  private async subscribeOHLC(ws: WebSocket): Promise<void> {
    this.subscribeOHLCClients.add(ws);
    const data = await this.appService.getAll();
    this.sendOHLC(ws, data);
  }

  private unsubscribeOHLC(ws: WebSocket): void {
    this.subscribeOHLCClients.delete(ws);
    ws.send(
      JSON.stringify(<GatewayResponsePayload>{
        eventName: 'ohlc',
        data: 'unsubscribe_success',
      }),
    );
  }

  private unsubscribeALL(ws: WebSocket): void {
    this.unsubscribeOHLC(ws);
  }

  private sendOHLC(ws: WebSocket, data: { [symbol: string]: OHLC[] }) {
    ws.send(JSON.stringify(<GatewayResponsePayload>{ eventName: 'ohlc', data: data }));
  }
}
