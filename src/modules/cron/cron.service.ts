import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
	NotificationType,
	ProjectPlan,
	TaskStatus,
	TransactionStatus
} from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { TelegramService } from '../libs/telegram/telegram.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class CronService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly notificationService: NotificationService,
		private readonly telegramService: TelegramService
	) {}

	@Cron('0 0 */30 * *')
	public async notifyUsersEnableTwoFactor() {
		const users = await this.prismaService.user.findMany({
			where: {
				isTotpEnabled: false
			},
			include: {
				notificationSettings: true
			}
		})

		for (const user of users) {
			if (user.notificationSettings.siteNotification) {
				await this.notificationService.createEnableTwoFactorNotification(
					user.id
				)
			}

			if (user.notificationSettings.telegramNotification && user.telegramId) {
				await this.telegramService.sendEnableTwoFactor(user.telegramId)
			}
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	public async deleteOldNotifications() {
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

		await this.prismaService.notification.deleteMany({
			where: {
				createdAt: {
					lte: sevenDaysAgo
				}
			}
		})
	}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	public async deleteOldTokens() {
		const oneDayAgo = new Date()
		oneDayAgo.setDate(oneDayAgo.getDate() - 1)

		await this.prismaService.token.deleteMany({
			where: {
				expiresIn: {
					lte: oneDayAgo
				}
			}
		})
	}

	@Cron(CronExpression.EVERY_6_HOURS)
	public async checkTasksOverdue() {
		const currentDate = new Date()

		const overdueTasks = await this.prismaService.task.findMany({
			where: {
				AND: [
					{
						status: {
							notIn: [TaskStatus.DONE, TaskStatus.CANCELLED]
						}
					},
					{
						dueDate: {
							lt: currentDate
						}
					}
				]
			},
			include: {
				assignees: {
					include: {
						user: true
					}
				},
				project: true
			}
		})

		for (const task of overdueTasks) {
			for (const assignee of task.assignees) {
				const existingNotification =
					await this.prismaService.notification.findFirst({
						where: {
							userId: assignee.userId,
							type: NotificationType.TASK_OVERDUE,
							message: {
								contains: task.id
							}
						}
					})

				if (!existingNotification) {
					await this.notificationService.createTaskOverdueNotification(
						assignee.userId,
						task.id
					)
				}

				const notificationSettings =
					await this.prismaService.notificationSettings.findUnique({
						where: { userId: assignee.userId }
					})

				if (
					notificationSettings?.telegramNotification &&
					assignee.user.telegramId
				) {
					await this.telegramService.sendTaskOverdue(
						assignee.user.telegramId,
						task.title,
						task.project.name,
						task.dueDate,
						task.priority
					)
				}
			}
		}
	}

	@Cron(CronExpression.EVERY_6_HOURS)
	public async checkExpiredPlans() {
		const currentDate = new Date()

		const expiredSubscriptions =
			await this.prismaService.projectSubscription.findMany({
				where: {
					AND: [
						{
							expiresAt: {
								lt: currentDate
							}
						},
						{
							project: {
								plan: {
									not: ProjectPlan.FREE
								}
							}
						}
					]
				},
				select: {
					id: true,
					projectId: true
				}
			})

		if (expiredSubscriptions.length === 0) return

		await this.prismaService.$transaction([
			this.prismaService.project.updateMany({
				where: {
					id: {
						in: expiredSubscriptions.map(sub => sub.projectId)
					}
				},
				data: {
					plan: ProjectPlan.FREE
				}
			}),
			this.prismaService.projectSubscription.updateMany({
				where: {
					id: {
						in: expiredSubscriptions.map(sub => sub.id)
					}
				},
				data: {
					status: TransactionStatus.EXPIRED
				}
			})
		])
	}
}
