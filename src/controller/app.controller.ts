import { Controller, Get, HttpException, HttpStatus, Query, Req, UseGuards } from '@nestjs/common';

import { Request } from 'express';

import { GetDataGuard } from '../middleware/get-data.guard';
import { AppService } from '../service/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('data')
  @UseGuards(GetDataGuard)
  async getData(@Req() req: Request, @Query('user') user: number): Promise<number[]> {
    try {
      return await this.appService.getData(user);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
