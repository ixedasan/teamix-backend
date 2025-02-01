import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { type Project, type User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import type { ChangeStatusInput } from './inputs/change-status.input'
import type { TaskInput } from './inputs/task.input'
import { UpdateTaskInput } from './inputs/update-task.input'

@Injectable()
export class TaskService {
	public constructor(private readonly prismaServie: PrismaService) {}

	public async findTask(taskId: string) {
		return this.prismaServie.task.findFirst({
			where: {
				id: taskId
			},
			include: {
				createdBy: true,
				assignees: true
			}
		})
	}

	public async findTasks(projectId: string) {
		const tasks = await this.prismaServie.task.findMany({
			where: { projectId },
			orderBy: [{ status: 'asc' }, { position: 'asc' }],
			include: {
				createdBy: true,
				assignees: { include: { user: true } },
				comments: true,
				labels: true
			}
		})

		return tasks
	}

	public async createTask(user: User, project: Project, input: TaskInput) {
		const maxPosition = await this.prismaServie.task.aggregate({
			where: {
				projectId: project.id,
				status: input.status
			},
			_max: { position: true }
		})

		const task = await this.prismaServie.task.create({
			data: {
				...input,
				position: (maxPosition._max?.position ?? -1) + 1,
				project: {
					connect: {
						id: project.id
					}
				},
				createdBy: {
					connect: { id: user.id }
				}
			},
			include: {
				createdBy: true,
				assignees: {
					include: { user: true }
				},
				comments: true,
				labels: true,
				links: true
			}
		})

		return task
	}

	public async updateTask(user: User, taskId: string, input: UpdateTaskInput) {
		const task = await this.prismaServie.task.findFirst({
			where: { id: taskId }
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const filteredInput = Object.fromEntries(
			Object.entries(input).filter(([_, value]) => value !== undefined)
		)

		if (Object.keys(filteredInput).length === 0) {
			throw new BadRequestException('No valid fields provided for update')
		}

		const updatedTask = await this.prismaServie.task.update({
			where: { id: taskId },
			data: { ...input },
			include: {
				createdBy: true,
				assignees: { include: { user: true } },
				comments: true,
				labels: true,
				links: true
			}
		})

		return updatedTask
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
			},
			include: {
				createdBy: true,
				assignees: {
					include: { user: true }
				},
				comments: true,
				labels: true,
				links: true
			}
		})

		return deletedTask
	}

	public async changeTaskStatus(input: ChangeStatusInput) {
		return this.prismaServie.$transaction(async tx => {
			const currentTask = await tx.task.findUnique({
				where: { id: input.taskId }
			})

			if (!currentTask) {
				throw new NotFoundException(`Task with id ${input.taskId} not found`)
			}

			const newStatus = input.status ?? currentTask.status
			const newPosition = input.position ?? currentTask.position

			if (
				newStatus !== currentTask.status ||
				newPosition !== currentTask.position
			) {
				if (newStatus !== currentTask.status) {
					await tx.task.updateMany({
						where: {
							status: currentTask.status,
							position: { gt: currentTask.position }
						},
						data: { position: { decrement: 1 } }
					})
				}

				await tx.task.updateMany({
					where: {
						status: newStatus,
						position: { gte: newPosition }
					},
					data: { position: { increment: 1 } }
				})
			}

			const updatedTask = await tx.task.update({
				where: { id: input.taskId },
				data: {
					status: newStatus,
					position: newPosition
				},
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

			return updatedTask
		})
	}

	public async findAllProjects() {
		return this.prismaServie.project.findMany()
	}
}
