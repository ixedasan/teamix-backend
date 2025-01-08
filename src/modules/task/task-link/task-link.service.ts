import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { TaskLinkInput } from './inputs/task-link.input'

@Injectable()
export class TaskLinkService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async getTaskLinks(taskId: string) {
		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			},
			include: {
				links: true
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		return task.links
	}

	public async createTaskLink(taskId: string, input: TaskLinkInput) {
		const { url, title } = input

		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		await this.prismaService.link.create({
			data: {
				url,
				title,
				task: {
					connect: { id: taskId }
				}
			}
		})

		return true
	}

	public async updateTaskLink(linkId: string, input: TaskLinkInput) {
		const { url, title } = input

		const link = await this.prismaService.link.findUnique({
			where: {
				id: linkId
			}
		})

		if (!link) {
			throw new NotFoundException('Link not found')
		}

		await this.prismaService.link.update({
			where: {
				id: linkId
			},
			data: {
				url,
				title
			}
		})

		return true
	}

	public async deleteTaskLink(linkId: string) {
		const link = await this.prismaService.link.findUnique({
			where: {
				id: linkId
			}
		})

		if (!link) {
			throw new NotFoundException('Link not found')
		}

		await this.prismaService.link.delete({
			where: {
				id: linkId
			}
		})

		return true
	}
}
