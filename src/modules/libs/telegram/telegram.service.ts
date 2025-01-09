import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'
import { TokenType } from '@/prisma/generated'
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
				await ctx.replyWithHTML(MESSAGES.invalidToken)
			}

			const hasExpired = new Date(authToken.expiresIn) < new Date()

			if (hasExpired) {
				return ctx.replyWithHTML(MESSAGES.invalidToken)
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
				return await this.onMe(ctx)
			} else {
				await ctx.replyWithHTML(MESSAGES.welcome, BUTTONS.profile)
			}
		}
	}

	@Command('me')
	@Action('me')
	public async onMe(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()

		const user = await this.findUserByChatId(chatId)

		await ctx.replyWithHTML(MESSAGES.profile(user), BUTTONS.profile)
	}

	@Command('tasks')
	@Action('tasks')
	public async onTasks(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()

		const user = await this.findUserByChatId(chatId)

		if (!user) {
			return await this.onMe(ctx)
		}

		const tasks = user.assignedTasks.map(task => task.task)

		if (!tasks.length) {
			return await ctx.reply('No tasks assigned')
		}

		const message = tasks
			.map(task => {
				return `📝 Task: ${task.title}\n📅 Deadline: ${task.dueDate}`
			})
			.join('\n\n')

		await ctx.reply(message)
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
						task: true
					}
				}
			}
		})

		return user
	}
}
