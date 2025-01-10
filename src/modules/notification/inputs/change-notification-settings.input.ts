import { Field, InputType } from '@nestjs/graphql'
import { IsBoolean } from 'class-validator'

@InputType()
export class ChangeNotificationSettingsInput {
	@Field(() => Boolean)
	@IsBoolean()
	siteNotification: boolean

	@Field(() => Boolean)
	@IsBoolean()
	telegramNotification: boolean
}
