import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/src/core/prisma/prisma.service'

@Injectable()
export class TaskAssigneeService {
	public constructor(private readonly prismaService: PrismaService) {}

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
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const user = await this.prismaService.user.findUnique({
			where: {
				id: userId
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		await this.prismaService.taskAssignee.create({
			data: {
				taskId,
				userId
			}
		})

		return true
	}

	public async unassignTask(taskId: string, userId: string) {
		await this.prismaService.taskAssignee.delete({
			where: {
				taskId_userId: {
					taskId,
					userId
				}
			}
		})

		return true
	}
}
