import { Controller, Get } from '@nestjs/common';
import { FORM } from './data';

@Controller()
export class AppController {
  constructor() {}

  @Get('templateForm')
  getTemplateForm(): any {
    return FORM;
  }
}
