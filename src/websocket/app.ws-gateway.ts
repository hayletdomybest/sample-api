import { OnModuleInit } from '@nestjs/common';
import {
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';

import { AppService } from '../service/app.service';

@WebSocketGateway({ cors: true, namespace: '/streaming' })
export class AppWsGateway implements OnModuleInit, OnGatewayDisconnect {
  private readonly ROOM_NAME = 'get_streaming';

  constructor(private readonly appService: AppService) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage('ohlc')
  async subscribe(client: any, payload: any): Promise<any> {
    const action = payload.action;
    switch (action) {
      case 'subscribe':
        await this._subscribe(client);
        break;
      case 'unsubscribe':
        client.leave(this.ROOM_NAME);
        break;
      default:
        client.disconnect();
        break;
    }
  }

  private async _subscribe(client: any): Promise<void> {
    client.join(this.ROOM_NAME);
    const data = await this.appService.getAll();
    client.emit('ohlc', data);
  }

  handleDisconnect(client: any): any {
    client.level(this.ROOM_NAME);
  }

  async onModuleInit(): Promise<void> {
    this.appService.subscribe((data) => {
      this.server.to(this.ROOM_NAME).emit('ohlc', data);
    });
  }
}
