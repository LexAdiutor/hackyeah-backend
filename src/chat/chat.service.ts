import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatType, Message, MessageSender } from './models/chat.model';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { Queue } from 'bull';
import { QueueService } from './queue.service';
import { FORM2 } from 'src/data/forms/form2';

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

  private async anyMessageWithId(chatId: string, messageId: string) {
    return (
      (await this.chatModel
        .findOne({
          id: chatId,
          'globalMessages.id': messageId,
        })
        .exec()) ||
      (await this.chatModel.findOne({
        id: chatId,
        'formMessages.id': messageId,
      }))
    );
  }

  async createHash() {
    const id = await this.generateUniqueId();
    const hash = this.hashSHA256(id);

    await this.chatModel.create({
      id,
      hash,
      globalMessages: [],
      formMessages: [
        {
          id: uuid(),
          sender: MessageSender.CHAT,
          message: 'Proszę opisz swoją sytuację.',
        },
      ],
      form: null,
    });

    return { hash };
  }

  async sendMessage(
    reqHash: string | undefined,
    message: string,
    type: ChatType,
  ) {
    let id = null;
    let msgId = null;
    let hash = null;
    let msg: Message;
    let isFirstFormMessage = false;

    if (!reqHash || !(await this.existsHash(reqHash))) {
      isFirstFormMessage = true;
      id = await this.generateUniqueId();
      hash = this.hashSHA256(id);
      msg = {
        id: uuid(),
        sender: MessageSender.USER,
        message,
      };
      const welcomeFormMsg: Message = {
        id: uuid(),
        sender: MessageSender.CHAT,
        message: 'Proszę opisz swoją sytuację.',
      };

      while (true) {
        welcomeFormMsg.id = uuid();
        if (msg.id !== welcomeFormMsg.id) break;
      }

      await this.chatModel.create({
        id,
        hash,
        globalMessages: type === ChatType.GLOBAL ? [msg] : [],
        formMessages:
          type === ChatType.GLOBAL ? [welcomeFormMsg] : [welcomeFormMsg, msg],
        form: null,
      });
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

      if (chat.formMessages.length <= 1) isFirstFormMessage = true;

      if (type === ChatType.GLOBAL) chat.globalMessages.push(msg);
      else chat.formMessages.push(msg);

      await chat.save();
    }

    this.queueService.addJob(async () => {
      this.loadingMessage = {
        chatId: id,
        msgId,
      };

      // TODO: REMOVE AND REPLACE WITH REAL CORE JOB

      const response = message.trim() === 'ok' ? 'PCC3' : 'NO';
      let backMessage = 'każda wiadomość';

      await new Promise((resolve) => setTimeout(resolve, 7000));

      const chat = await this.chatModel
        .findOne({ id: this.loadingMessage?.chatId })
        .exec();

      if (isFirstFormMessage) {
        backMessage =
          response === 'NO'
            ? 'Przepraszamy, ale nie wspieramy wypełniania wniosku dla tego podatku.'
            : 'Zauważyłem, że musisz wypełnić formularz PCC3. Proszę o wypełnienie danych, które wyświetlają Ci się po prawej stronie.';
        if (response === 'PCC3') {
          chat.form = FORM2
          chat.formName = 'FORM2';
        };
      }

      if (!chat) return (this.loadingMessage = null);

      let chatMsgId = null;
      while (true) {
        chatMsgId = uuid();
        if (!(await this.anyMessageWithId(id, chatMsgId))) break;
      }

      const chatMsg: Message = {
        id: chatMsgId,
        sender: MessageSender.CHAT,
        message: backMessage,
      };

      if (type === ChatType.GLOBAL) chat.globalMessages.push(chatMsg);
      else chat.formMessages.push(chatMsg);
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
      working: !!(
        this.loadingMessage &&
        this.hashSHA256(this.loadingMessage?.chatId ?? '') === reqHash
      ),
    };
  }

  async getChat(reqHash: string | undefined) {
    if (!reqHash || !(await this.existsHash(reqHash))) {
      throw new NotFoundException('Chat not found');
    }

    return this.chatModel
      .findOne({ hash: reqHash })
      .select('-id')
      .select('-_id')
      .exec();
  }

  async submitForm(reqHash: string, body: Record<string, string>) {
    if (!reqHash || !(await this.existsHash(reqHash))) {
      throw new NotFoundException('Chat not found');
    }

    const chat = await this.chatModel.findOne({ hash: reqHash }).exec();

    if (!chat) throw new NotFoundException('Chat not found');

    const form = chat.form;
    const formName = chat.formName;

    if (!form || !formName) throw new NotFoundException('Form not found');

    chat.forms = {...(chat.forms ?? {}), [formName]: body};
    chat.form = null;
    chat.formName = null;

    chat.formMessages.push({
      id: uuid(),
      sender: MessageSender.USER,
      message: 'Wysłano formularz.',
    });

    await chat.save();

    switch (formName) {
      case 'FORM2': {
        const location = body?.location;
        const activityPerformencePlace = body?.activityPerformencePlace;
        const msg: Message = {
          id: uuid(),
          sender: MessageSender.CHAT,
          message: '',
        };

        if (location === 'terytorium RP' && activityPerformencePlace === 'terytorium RP') {
          msg.message = 'Jest ok.';
        } else if (location === 'poza terytorium RP' && activityPerformencePlace === 'poza terytorium RP') {
          msg.message = 'Nie musisz odprowadzać podatku PCC, kiedy miejsce dokonania czynności cywilnoprawnej i miejsce położenia rzeczy lub miejsce wykonywania prawa majątkowego znajdują się poza terytorium RP.';
        } else if (location === 'terytorium RP' && activityPerformencePlace === 'poza terytorium RP') {
          msg.message = 'Nie musisz odprowadzać podatku PCC, kiedy miejsce dokonania czynności cywilnoprawnej jest poza terytorium RP. A miejsce położenia rzeczy lub miejsce wykonywania prawa majątkowego znajduje na terytorium RP.';
        } else {
          msg.message = 'Skontaktuj się z urzędem, aby dowiedzieć się czy musisz odprowadzić podatek PCC od tej czynności cywilnoprawnej.';
        }

        chat.formMessages.push(msg);
        await chat.save();

        return { success: true };
      }
      default:
        return { success: true };
    }
  }
}
