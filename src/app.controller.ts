import { Controller, Get } from '@nestjs/common';
import { FORM } from './data/forms/form1';

@Controller()
export class AppController {
  constructor() {}

  @Get('form1')
  getTemplateForm(): any {
    return FORM;
  }
}
