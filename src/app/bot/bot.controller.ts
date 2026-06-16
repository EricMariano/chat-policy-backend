import { Controller, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { BotService } from './bot.service';

@ApiTags('bot')
@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('messages')
  @ApiExcludeEndpoint()
  async messages(@Req() request: Request, @Res() response: Response) {
    await this.botService.processActivity(request, response);
  }
}
