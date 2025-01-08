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
		await this.prismaService.taskLabel.create({
			data: {
				...input,
				project: {
					connect: {
						id: projectId
					}
				}
			}
		})

		return true
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

		await this.prismaService.task.update({
			where: {
				id: taskId
			},
			data: {
				labels: {
					connect: {
						id: labelId
					}
				}
			}
		})

		return true
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

		await this.prismaService.task.update({
			where: {
				id: taskId
			},
			data: {
				labels: {
					disconnect: {
						id: labelId
					}
				}
			}
		})

		return true
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
