import { Injectable } from '@nestjs/common'
import { TokenType, type User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { generateToken } from '@/src/shared/utils/generate-token.util'
import { type ChangeNotificationSettingsInput } from './inputs/change-notification-settings.input'

@Injectable()
export class NotificationService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findUnreadCount(userId: string) {
		const count = await this.prismaService.notification.count({
			where: {
				userId,
				isRead: false
			}
		})

		return count
	}

	public async findByUser(userId: string) {
		await this.prismaService.notification.updateMany({
			where: {
				userId,
				isRead: false
			},
			data: {
				isRead: true
			}
		})

		const notifications = await this.prismaService.notification.findMany({
			where: {
				userId
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		return notifications
	}

	public async changeSettings(
		user: User,
		input: ChangeNotificationSettingsInput
	) {
		const { siteNotification, telegramNotification } = input

		const notificationSettings =
			await this.prismaService.notificationSettings.upsert({
				where: {
					userId: user.id
				},
				create: {
					siteNotification,
					telegramNotification,
					user: {
						connect: {
							id: user.id
						}
					}
				},
				update: {
					siteNotification,
					telegramNotification
				},
				include: {
					user: true
				}
			})

		if (
			notificationSettings.telegramNotification &&
			!notificationSettings.user.telegramId
		) {
			const telegramAuthToken = await generateToken(
				this.prismaService,
				user,
				TokenType.TELEGRAM_AUTH
			)

			return {
				notificationSettings,
				telegramAuthToken: telegramAuthToken.token
			}
		}

		if (
			!notificationSettings.telegramNotification &&
			notificationSettings.user.telegramId
		) {
			await this.prismaService.user.update({
				where: {
					id: user.id
				},
				data: {
					telegramId: null
				}
			})

			return { notificationSettings }
		}

		return { notificationSettings }
	}
}
