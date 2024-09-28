import { Body, Controller, Post } from '@nestjs/common';
import { ConventerService } from './conventer.service';

@Controller('conventer')
export class ConventerController {
  constructor(private readonly conventerService: ConventerService) {}

  @Post('xml-to-json')
  async convertXmlToJson(@Body() { xml }: { xml: string }) {
    return this.conventerService.convertXmlToJson(xml);
  }
}
