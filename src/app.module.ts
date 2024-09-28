import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ConventerModule } from './conventer/conventer.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      'mongodb+srv://xname:Kotwica123@cluster007.tehhahg.mongodb.net/?retryWrites=true&w=majority&appName=cluster007',
      { dbName: 'hackyeah' },
    ),
    UsersModule,
    AuthModule,
    ConventerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
