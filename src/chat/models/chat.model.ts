import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum MessageSender {
  USER = 'USER',
  CHAT = 'CHAT',
}

export interface Message {
  id: string;
  sender: MessageSender;
  message: string;
}

export enum ChatType {
  GLOBAL = 'GLOBAL',
  FORM = 'FORM',
}

@Schema({ id: false })
export class Chat extends Document {
  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: String, required: true })
  hash: string;

  @Prop({ type: [Object], default: [], required: true })
  globalMessages: Message[];

  @Prop({ type: [Object], default: [], required: true })
  formMessages: Message[];

  @Prop({ type: String, required: false })
  form: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
