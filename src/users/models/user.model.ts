import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document as Doc } from "mongoose";

@Schema()
export class User extends Doc {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);