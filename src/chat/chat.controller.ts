import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Request } from 'express';
import { SendMessageDto } from './dtos/SendMessageDto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/sendMessage')
  async sendMessage(@Req() req: Request, @Body() body: SendMessageDto) {
    return this.chatService.sendMessage(req.headers?.authorization, body.message, body.type);
  }

  @Get('/getMessage')
  async getMessage(@Req() req: Request) {
    return this.chatService.getMessage(req.headers?.authorization);
  }

  @Get('/getChat')
  async getChat(@Req() req: Request) {
    return this.chatService.getChat(req.headers?.authorization);
  }
}
