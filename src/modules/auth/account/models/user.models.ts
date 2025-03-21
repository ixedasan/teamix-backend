import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { User } from '@/prisma/generated'
import { NotificationSettingsModel } from '@/src/modules/notification/models/notification-settings.model'
import { NotificationModel } from '@/src/modules/notification/models/notification.model'
import { SocialLinksModel } from '../../profile/models/social-links.model'

@ObjectType()
export class UserModel implements User {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public email: string

	@Field(() => String)
	public password: string

	@Field(() => String)
	public username: string

	@Field(() => String)
	public displayName: string

	@Field(() => String, { nullable: true })
	public avatar: string

	@Field(() => String, { nullable: true })
	public bio: string

	@Field(() => String, { nullable: true })
	public telegramId: string

	@Field(() => Boolean)
	public isVerified: boolean

	@Field(() => Boolean)
	public isEmailVerified: boolean

	@Field(() => Boolean)
	public isTotpEnabled: boolean

	@Field(() => String, { nullable: true })
	public totpSecret: string

	@Field(() => [SocialLinksModel])
	public socialLinks: SocialLinksModel[]

	@Field(() => [NotificationModel])
	public notifications: NotificationModel[]

	@Field(() => NotificationSettingsModel)
	public notificationSettings: NotificationSettingsModel

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
