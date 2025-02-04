import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { type CreateLabelInput } from './inputs/create-label.input'

@Injectable()
export class TaskLabelsService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async getProjectLabels(projectId: string) {
		return this.prismaService.taskLabel.findMany({
			where: {
				projectId
			}
		})
	}

	public async getTaskLabels(taskId: string) {
		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		return this.prismaService.taskLabel.findMany({
			where: {
				tasks: {
					some: {
						id: taskId
					}
				}
			}
		})
	}

	public async createLabel(projectId: string, input: CreateLabelInput) {
		const label = await this.prismaService.taskLabel.create({
			data: {
				...input,
				project: {
					connect: {
						id: projectId
					}
				}
			}
		})

		return label
	}

	public async addLabelToTask(taskId: string, labelId: string) {
		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const label = await this.prismaService.taskLabel.findUnique({
			where: {
				id: labelId
			}
		})

		if (!label) {
			throw new NotFoundException('Label not found')
		}

		const updatedTask = await this.prismaService.task.update({
			where: {
				id: taskId
			},
			data: {
				labels: {
					connect: {
						id: labelId
					}
				}
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
	}

	public async removeLabelFromTask(taskId: string, labelId: string) {
		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const label = await this.prismaService.taskLabel.findUnique({
			where: {
				id: labelId
			}
		})

		if (!label) {
			throw new NotFoundException('Label not found')
		}

		const updatedTask = await this.prismaService.task.update({
			where: {
				id: taskId
			},
			data: {
				labels: {
					disconnect: {
						id: labelId
					}
				}
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
	}

	public async deleteLabel(id: string) {
		await this.prismaService.taskLabel.delete({
			where: {
				id
			}
		})

		return true
	}
}
