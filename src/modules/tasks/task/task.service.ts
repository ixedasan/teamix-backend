import { Injectable, NotFoundException } from '@nestjs/common'
import { type Project, type User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import type { ChangeStatusInput } from './inputs/change-status.input'
import type { TaskInput } from './inputs/task.input'

@Injectable()
export class TaskService {
	public constructor(private readonly prismaServie: PrismaService) {}

	public async findTask(taskId: string) {
		return this.prismaServie.task.findFirst({
			where: {
				id: taskId
			}
		})
	}

	public async findTasks(projectId: string) {
		return this.prismaServie.task.findMany({
			where: {
				projectId
			},
			orderBy: {
				createdAt: 'desc'
			}
		})
	}

	public async createTask(user: User, project: Project, input: TaskInput) {
		const task = await this.prismaServie.task.create({
			data: {
				...input,
				project: {
					connect: {
						id: project.id
					}
				},
				createdBy: {
					connect: {
						id: user.id
					}
				}
			},
			include: {
				project: true,
				createdBy: true
			}
		})

		return task
	}

	public async updateTask(user: User, taskId: string, input: TaskInput) {
		const task = await this.prismaServie.task.findFirst({
			where: {
				id: taskId,
				createdById: user.id
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const newTask = await this.prismaServie.task.update({
			where: {
				id: taskId
			},
			data: { ...input },
			include: {
				project: true,
				createdBy: true
			}
		})

		return newTask
	}

	public async deleteTask(taskId: string) {
		const task = await this.prismaServie.task.findFirst({
			where: {
				id: taskId
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const deletedTask = await this.prismaServie.task.delete({
			where: {
				id: taskId
			}
		})

		return deletedTask
	}

	public async changeTaskStatus(input: ChangeStatusInput) {
		const { taskId, status } = input

		const task = await this.prismaServie.task.update({
			where: {
				id: taskId
			},
			data: {
				status
			}
		})

		return task
	}

	public async findAllProjects() {
		return this.prismaServie.project.findMany()
	}
}
