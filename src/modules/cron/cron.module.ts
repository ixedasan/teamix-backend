import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TelegramService } from '../libs/telegram/telegram.service'
import { NotificationService } from '../notification/notification.service'
import { CronService } from './cron.service'

@Module({
	imports: [ScheduleModule.forRoot()],
	providers: [CronService, NotificationService, TelegramService]
})
export class CronModule {}
