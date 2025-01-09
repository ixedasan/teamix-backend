import { Field, ObjectType } from '@nestjs/graphql'
import { type NotificationSettings } from '@/prisma/generated'
import { UserModel } from '../../auth/account/models/user.models'

@ObjectType()
export class NotificationSettingsModel implements NotificationSettings {
	@Field(() => String)
	public id: string

	@Field(() => Boolean)
	public siteNotification: boolean

	@Field(() => Boolean)
	public telegramNotification: boolean

	@Field(() => String)
	public userId: string

	@Field(() => UserModel)
	public user: UserModel

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}

@ObjectType()
export class ChangeNotificationsSettingsResponse {
	@Field(() => NotificationSettingsModel)
	public notificationSettings: NotificationSettingsModel

	@Field(() => String, { nullable: true })
	public telegramAuthToken?: string
}
