import { Injectable } from '@nestjs/common'
import { NotificationType, TokenType, type User } from '@/prisma/generated'
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

	async createEnableTwoFactorNotification(userId: string) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `<b className='font-medium'>Account Security</b>
        <p>We recommend enabling two-factor authentication to increase the security of your account.</p>`,
				type: NotificationType.ENABLE_TWO_FACTOR,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})
		return notification
	}

	async createProjectInvitationNotification(
		userId: string,
		projectName: string
	) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `<b className='font-medium'>Invitation to the project</b>
        <p>You are invited to join the project "${projectName}".</p>
				<p>Check your e-mail to accept the invitation.</p>`,
				type: NotificationType.PROJECT_INVITATION,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})
		return notification
	}

	async createTaskAssignedNotification(userId: string, taskTitle: string) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `<b className='font-medium'>New task</b>
        <p>You've been assigned a task "${taskTitle}".</p>`,
				type: NotificationType.TASK_ASSIGNED,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})
		return notification
	}

	async createTaskOverdueNotification(userId: string, taskTitle: string) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `<b className='font-medium'>The task is expiring</b>
        <p>The deadline for the task “${taskTitle}” is approaching.</p>`,
				type: NotificationType.TASK_OVERDUE,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})
		return notification
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
