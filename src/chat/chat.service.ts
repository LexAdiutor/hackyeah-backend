import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatType, Message, MessageSender } from './models/chat.model';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { Queue } from 'bull';
import { QueueService } from './queue.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
    private readonly queueService: QueueService,
  ) {}

  private loadingMessage: { chatId: string; msgId: string } | null = null;

  private async generateUniqueId() {
    while (true) {
      const id = uuid();
      if (!(await this.existsId(id))) {
        return id;
      }
    }
  }

  private async existsHash(hash: string): Promise<boolean> {
    return !!(await this.chatModel
      .findOne({ hash })
      .select('-globalMessages')
      .select('-formMessages')
      .exec());
  }

  private async existsId(id: string): Promise<boolean> {
    return !!(await this.chatModel.findOne({ id }).select('-messages').exec());
  }

  private hashSHA256(data: string) {
    return createHash('sha256').update(data).digest('hex');
  }

  private anyMessageWithId(chatId: string, messageId: string) {
    return this.chatModel
      .findOne({
        id: chatId,
        'messages.id': messageId,
      })
      .exec();
  }

  async sendMessage(reqHash: string | undefined, message: string, type: ChatType) {
    let id = null;
    let msgId = null;
    let hash = null;
    let msg: Message;

    if (!reqHash || !(await this.existsHash(reqHash))) {
      id = await this.generateUniqueId();
      hash = this.hashSHA256(id);
      msg = {
        id: uuid(),
        sender: MessageSender.USER,
        message,
      };
      await this.chatModel.create({ id, hash, messages: [msg], form: '' });
    } else {
      hash = reqHash;
      const chat = await this.chatModel
        .findOne({
          hash,
        })
        .exec();

      if (!chat) throw new NotFoundException('Chat not found');

      id = chat.id;
      while (true) {
        msgId = uuid();
        if (!(await this.anyMessageWithId(id, msgId))) {
          break;
        }
      }

      msg = {
        id: msgId,
        sender: MessageSender.USER,
        message,
      };

      if (type === ChatType.GLOBAL)
        chat.globalMessages.push(msg);
      else
        chat.formMessages.push(msg);

      await chat.save();
    }

    this.queueService.addJob(async () => {
      this.loadingMessage = {
        chatId: id,
        msgId,
      };

      // TODO: REMOVE AND REPLACE WITH REAL CORE JOB
      await new Promise((resolve) => setTimeout(resolve, 15000));

      const chat = await this.chatModel
        .findOne({ id: this.loadingMessage?.chatId })
        .exec();

      if (!chat) return (this.loadingMessage = null);

      let chatMsgId = null;
      while (true) {
        chatMsgId = uuid();
        if (!(await this.anyMessageWithId(id, chatMsgId))) break;
      }

      const chatMsg: Message = {
        id: chatMsgId,
        sender: MessageSender.CHAT,
        message: 'Hello from chat',
      };

      if (type === ChatType.GLOBAL)
        chat.globalMessages.push(chatMsg);
      else
        chat.formMessages.push(chatMsg);
      await chat.save();

      this.loadingMessage = null;
    });

    return { hash, message: msg };
  }

  async getMessage(reqHash: string | undefined) {
    if (!reqHash || !(await this.existsHash(reqHash))) {
      throw new NotFoundException('Chat not found');
    }

    return {
      working:
        !!(this.loadingMessage &&
        this.hashSHA256(this.loadingMessage?.chatId ?? '') === reqHash),
    };
  }

  async getChat(reqHash: string | undefined) {
    if (!reqHash || !(await this.existsHash(reqHash))) {
      throw new NotFoundException('Chat not found');
    }

    return this.chatModel.findOne({ hash: reqHash }).select('-id').select('-_id').exec();
  }
}
