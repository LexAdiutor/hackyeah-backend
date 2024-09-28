import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ChatType } from "../models/chat.model";

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(ChatType)
  type: ChatType;
}