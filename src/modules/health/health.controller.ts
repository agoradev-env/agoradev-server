import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database')
  async checkDatabase() {
    try {
      const client = this.databaseService.getClient();
      
      return {
        status: 'ok',
        database: 'connected',
        supabase_url: process.env.SUPABASE_URL,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
