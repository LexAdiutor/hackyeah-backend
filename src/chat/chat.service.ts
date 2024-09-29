import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatType, Message, MessageSender } from './models/chat.model';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { Queue } from 'bull';
import { QueueService } from './queue.service';
import { FORM2 } from 'src/data/forms/form2';
import { getFields } from 'src/data/forms/fields';
import { FORM } from 'src/data/forms/form1';

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

      let is_pcc: Boolean = false;
      let backMessage = 'Brak odpowiedzi.';

      const chat = await this.chatModel.findOne({ id: this.loadingMessage?.chatId }).exec();

      try {
        const response = await fetch(`${process.env.CORE_URL}/sendMichalMsg`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            msg_id: this.loadingMessage.chatId,
            message,
            isFirstFormMessage
          }),
        });

        const data = await response.json();
        is_pcc = data?.is_pcc === 'pcc';

        if (data?.fields && chat) {
          data.fields.forEach(({name, value}) => chat.fields[name] = value);

          chat.form = FORM;
          chat.formName = 'FORM1';

          await chat.save();
        }

        if (data?.message)
          backMessage = data.message;
      } catch {
        if (chat) {
          if (type === ChatType.FORM)
            chat.formMessages.push({
              id: uuid(),
              sender: MessageSender.CHAT,
              message: 'Przepraszamy, ale wystąpił błąd. Proszę spróbować ponownie później.',
            });
          else
            chat.globalMessages.push({
              id: uuid(),
              sender: MessageSender.CHAT,
              message: 'Przepraszamy, ale wystąpił błąd. Proszę spróbować ponownie później.',
            });
          await chat.save();
        }
        this.loadingMessage = null;
        return;
      }

      if (isFirstFormMessage) {
        backMessage =
          !is_pcc
            ? 'Przepraszamy, ale nie wspieramy wypełniania wniosku dla tego podatku.'
            : 'Zauważyłem, że musisz wypełnić formularz PCC3. Proszę o wypełnienie danych, które wyświetlają Ci się po prawej stronie.';
        if (is_pcc) {
          chat.form = FORM2
          chat.formName = 'FORM2';
        } else {
          chat.ended = true;
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

    if (!chat.fields) chat.fields = getFields();

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
          msg.message = 'Przyjęto formularz.';
        } else if (location === 'poza terytorium RP' && activityPerformencePlace === 'poza terytorium RP') {
          msg.message = 'Nie musisz odprowadzać podatku PCC, kiedy miejsce dokonania czynności cywilnoprawnej i miejsce położenia rzeczy lub miejsce wykonywania prawa majątkowego znajdują się poza terytorium RP.';
          chat.ended = true;
        } else if (location === 'terytorium RP' && activityPerformencePlace === 'poza terytorium RP') {
          msg.message = 'Nie musisz odprowadzać podatku PCC, kiedy miejsce dokonania czynności cywilnoprawnej jest poza terytorium RP. A miejsce położenia rzeczy lub miejsce wykonywania prawa majątkowego znajduje na terytorium RP.';
          chat.ended = true;
        } else {
          msg.message = 'Skontaktuj się z urzędem, aby dowiedzieć się czy musisz odprowadzić podatek PCC od tej czynności cywilnoprawnej.';
          chat.ended = true;
        }

        chat.formMessages.push(msg);
        await chat.save();

        return { success: true };
      }
      case 'FORM1': {
        chat.fields['P_1'] = body?.nip ?? body?.pesel;
        switch(body?.entity) {
          case 'Podmiot zobowiązany solidarnie do zapłaty podatku':
            chat.fields['P_2'] = '1';
            break;
          case 'Strona umowy zamiany':
            chat.fields['P_2'] = '2';
            break;
          case 'Wspólnik spółki cywilnej':
            chat.fields['P_2'] = '3';
            break;
          case 'Podmiot, o którym mowa w art. 9 pkt 10 lit. b ustawy (pożyczkobiorca)':
            chat.fields['P_2'] = '4';
            break;
          case 'Inny podmiot':
            chat.fields['P_2'] = '5';
            break;
          default:
            break;
        };
        switch(body?.taxprayerType) {
          case 'podatnik niebędący osobą fizyczną':
            chat.fields['P_8'] = '1';
            break;
          case 'osoba fizyczna':
            chat.fields['P_8'] = '2';
            break;
          default:
            break;
        };
        chat.fields['P_9'] = body?.fullname ?? `${body?.surname ?? ''}, ${body?.firstName ?? ''}, ${body?.birthDate ?? ''}`;
        chat.fields['P_10'] = body?.shortName ?? `${body?.fathersFirstName ?? ''}, ${body?.mothersFirstName ?? ''}`;
        chat.fields['P_11'] = body?.country ?? '';
        chat.fields['P_12'] = body?.province ?? '';
        chat.fields['P_13'] = body?.district ?? '';
        chat.fields['P_14'] = body?.commune ?? '';
        chat.fields['P_15'] = body?.street ?? '';
        chat.fields['P_16'] = body?.houseNumber ?? '';
        chat.fields['P_17'] = body?.apartmentNumber ?? '';
        chat.fields['P_18'] = body?.town ?? '';
        chat.fields['P_19'] = body?.zipCode ?? '';

        await chat.save();
      }
      default:
        return { success: true };
    }
  }
}
