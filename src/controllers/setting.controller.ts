import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { SettingService } from '../services/setting.service';

@Controller('api/settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async getAllSettings(@Req() req: any) {
    const organizationId = req.session.organizationId;
    if (!organizationId) {
      return { success: false, message: 'Organization not found' };
    }
    const settings = await this.settingService.getAllSettings(organizationId);
    return { success: true, settings };
  }

  @Get('config')
  async getConfig(@Req() req: any) {
    const organizationId = req.session.organizationId;
    if (!organizationId) {
      return { success: false, message: 'Organization not found' };
    }
    const config = await this.settingService.getConfigObject(organizationId);
    return { success: true, config };
  }

  

  @Post('init')
  async initialize(@Req() req: any) {
    const organizationId = req.session.organizationId;
    if (!organizationId) {
      return { success: false, message: 'Organization not found' };
    }
    await this.settingService.initializeDefaults(organizationId);
    return { success: true, message: 'Settings initialized' };
  }

  @Post(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body('value') value: number,
    @Req() req: any,
  ) {
    const organizationId = req.session.organizationId;
    if (!organizationId) {
      return { success: false, message: 'Organization not found' };
    }
    const setting = await this.settingService.updateSetting(key, value, organizationId);
    if (!setting) {
      return { success: false, message: 'Setting not found' };
    }
    return { success: true, setting };
  }
}
