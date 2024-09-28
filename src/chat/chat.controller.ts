import { Controller, Get, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/sendMessage')
  async sendMessage() {
    return this.chatService.sendMessage();
  }

  @Get('/getMessage')
  async getMessage() {
    return this.chatService.getMessage();
  }
}
