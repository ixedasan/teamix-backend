import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { TelegramService } from '../../libs/telegram/telegram.service'
import { NotificationService } from '../../notification/notification.service'

@Injectable()
export class TaskAssigneeService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly notificationService: NotificationService,
		private readonly telegramService: TelegramService
	) {}

	public async getTaskAssignees(taskId: string) {
		const taskAssignees = await this.prismaService.taskAssignee.findMany({
			where: {
				taskId
			},
			include: {
				user: true,
				task: true
			}
		})

		return taskAssignees
	}

	public async assignTask(taskId: string, userId: string) {
		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			},
			include: {
				project: {
					select: { name: true }
				}
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const user = await this.prismaService.user.findUnique({
			where: {
				id: userId
			},
			include: {
				notificationSettings: true
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		const updatedTask = await this.prismaService.$transaction(async prisma => {
			await prisma.taskAssignee.create({
				data: {
					taskId,
					userId
				}
			})

			return prisma.task.findUnique({
				where: { id: taskId },
				include: {
					createdBy: true,
					assignees: {
						include: {
							user: true
						}
					},
					comments: true,
					labels: true,
					links: true
				}
			})
		})

		if (user.notificationSettings.siteNotification) {
			await this.notificationService.createTaskAssignedNotification(
				userId,
				task.title
			)
		}

		if (user.notificationSettings.telegramNotification && user.telegramId) {
			await this.telegramService.sendTaskAssigned(
				user.telegramId,
				task.title,
				task.project.name
			)
		}

		return updatedTask
	}

	public async unassignTask(taskId: string, userId: string) {
		const updatedTask = await this.prismaService.$transaction(async prisma => {
			await prisma.taskAssignee.delete({
				where: {
					taskId_userId: {
						taskId,
						userId
					}
				}
			})

			return prisma.task.findUnique({
				where: { id: taskId },
				include: {
					createdBy: true,
					assignees: {
						include: {
							user: true
						}
					},
					comments: {
						include: {
							author: true
						}
					},
					labels: true,
					links: true
				}
			})
		})

		if (!updatedTask) {
			throw new NotFoundException('Task not found')
		}

		return updatedTask
	}
}
