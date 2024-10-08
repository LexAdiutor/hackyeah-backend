import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChatModule,
    MongooseModule.forRoot(
      'mongodb+srv://xname:Kotwica123@cluster007.tehhahg.mongodb.net/?retryWrites=true&w=majority&appName=cluster007',
      { dbName: 'hackyeah' },
    ),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
