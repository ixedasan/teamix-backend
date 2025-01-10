import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'
import { TaskStatus, TokenType } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { BUTTONS } from './telegram.buttons'
import { MESSAGES } from './telegram.messages'

@Update()
@Injectable()
export class TelegramService extends Telegraf {
	private readonly _token: string

	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService
	) {
		super(configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'))
		this._token = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
	}

	@Start()
	public async onStart(@Ctx() ctx: any) {
		const chatId = ctx.chat.id.toString()
		const token = ctx.message.text.split(' ')[1]

		if (token) {
			const authToken = await this.prismaService.token.findUnique({
				where: {
					token,
					type: TokenType.TELEGRAM_AUTH
				}
			})

			if (!authToken) {
				return await ctx.replyWithHTML(MESSAGES.invalidToken)
			}

			const hasExpired = new Date(authToken.expiresIn) < new Date()

			if (hasExpired) {
				return await ctx.replyWithHTML(MESSAGES.invalidToken)
			}

			await this.connectTelegram(authToken.userId, chatId)

			await this.prismaService.token.delete({
				where: {
					id: authToken.id
				}
			})

			await ctx.replyWithHTML(MESSAGES.authSuccess, BUTTONS.authSuccess)
		} else {
			const user = await this.findUserByChatId(chatId)

			if (!user) {
				return await ctx.replyWithHTML(MESSAGES.welcome, BUTTONS.profile)
			} else {
				const taskStats = await this.getTaskStats(user.id)
				await ctx.replyWithHTML(
					MESSAGES.profile(user, taskStats),
					BUTTONS.profile
				)
			}
		}
	}

	@Command('me')
	@Action('me')
	public async onMe(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()
		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return await ctx.replyWithHTML(MESSAGES.welcome, BUTTONS.profile)
		}

		const taskStats = await this.getTaskStats(user.id)
		await ctx.replyWithHTML(MESSAGES.profile(user, taskStats), BUTTONS.profile)
	}

	@Command('tasks')
	@Action('tasks')
	public async onTasks(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()
		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return await ctx.replyWithHTML(MESSAGES.welcome)
		}

		const tasksByProject = this.groupTasksByProject(user.assignedTasks)

		if (Object.keys(tasksByProject).length === 0) {
			await ctx.reply('No tasks assigned', BUTTONS.taskControls)
		} else {
			const message = this.formatProjectTasks(tasksByProject)
			await ctx.reply(message, BUTTONS.taskControls)
		}
	}

	@Action('tasks_overdue')
	public async onOverdueTasks(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()
		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return await ctx.replyWithHTML(MESSAGES.welcome)
		}

		const overdueTasks = user.assignedTasks.filter(({ task }) => {
			return task.dueDate && new Date(task.dueDate) < new Date()
		})

		if (!overdueTasks.length) {
			await ctx.reply('No overdue tasks', BUTTONS.taskControls)
		} else {
			const tasksByProject = this.groupTasksByProject(overdueTasks)
			const message = this.formatProjectTasks(tasksByProject)
			await ctx.reply('⚠️ Overdue Tasks:\n\n' + message, BUTTONS.taskControls)
		}
	}

	@Action('tasks_in_progress')
	public async onInProgressTasks(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()
		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return await ctx.replyWithHTML(MESSAGES.welcome)
		}

		const inProgressTasks = user.assignedTasks.filter(({ task }) => {
			return task.status === TaskStatus.IN_PROGRESS
		})

		if (!inProgressTasks.length) {
			await ctx.reply('No tasks in progress', BUTTONS.taskControls)
		} else {
			const tasksByProject = this.groupTasksByProject(inProgressTasks)
			const message = this.formatProjectTasks(tasksByProject)
			await ctx.reply(
				'🔄 In Progress Tasks:\n\n' + message,
				BUTTONS.taskControls
			)
		}
	}

	@Action('tasks_completed')
	public async onCompletedTasks(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()
		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return await ctx.replyWithHTML(MESSAGES.welcome)
		}

		const completedTasks = user.assignedTasks.filter(({ task }) => {
			return task.status === TaskStatus.DONE
		})

		if (!completedTasks.length) {
			await ctx.reply('No completed tasks', BUTTONS.taskControls)
		} else {
			const tasksByProject = this.groupTasksByProject(completedTasks)
			const message = this.formatProjectTasks(tasksByProject)
			await ctx.reply('✅ Completed Tasks:\n\n' + message, BUTTONS.taskControls)
		}
	}

	private async getTaskStats(userId: string) {
		const tasks = await this.prismaService.taskAssignee.findMany({
			where: { userId },
			include: { task: true }
		})

		return {
			total: tasks.length,
			overdue: tasks.filter(
				({ task }) => task.dueDate && new Date(task.dueDate) < new Date()
			).length,
			inProgress: tasks.filter(
				({ task }) => task.status === TaskStatus.IN_PROGRESS
			).length,
			completed: tasks.filter(({ task }) => task.status === TaskStatus.DONE)
				.length
		}
	}

	private groupTasksByProject(assignedTasks: Array<{ task: any }>) {
		return assignedTasks.reduce((acc, { task }) => {
			const projectName = task.project?.name || 'Unassigned'
			if (!acc[projectName]) {
				acc[projectName] = []
			}
			acc[projectName].push(task)
			return acc
		}, {})
	}

	private formatProjectTasks(tasksByProject: Record<string, any[]>) {
		return Object.entries(tasksByProject)
			.map(([projectName, tasks]) => {
				const tasksList = tasks
					.map(task => {
						const deadline = task.dueDate
							? `📅 Due: ${new Date(task.dueDate).toLocaleDateString()}`
							: '📅 No deadline'

						const priority = task.priority
							? `🎯 Priority: ${task.priority}`
							: ''

						const status = `📊 Status: ${task.status}`

						return [
							`  • ${task.title}`,
							`    ${deadline}`,
							`    ${status}`,
							priority ? `    ${priority}` : ''
						]
							.filter(Boolean)
							.join('\n')
					})
					.join('\n\n')

				return `📁 Project: ${projectName}\n\n${tasksList}`
			})
			.join('\n\n' + '─'.repeat(30) + '\n\n')
	}

	private async connectTelegram(userId: string, chatId: string) {
		await this.prismaService.user.update({
			where: {
				id: userId
			},
			data: {
				telegramId: chatId
			}
		})
	}

	private async findUserByChatId(chatId: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				telegramId: chatId
			},
			include: {
				memberships: {
					select: {
						project: true
					}
				},
				assignedTasks: {
					include: {
						task: {
							include: {
								project: true
							}
						}
					}
				},
				notificationSettings: true
			}
		})

		return user
	}
}
