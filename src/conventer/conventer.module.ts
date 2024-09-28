import { Module } from '@nestjs/common';
import { ConventerService } from './conventer.service';
import { ConventerController } from './conventer.controller';

@Module({
  controllers: [ConventerController],
  providers: [ConventerService],
})
export class ConventerModule {}
