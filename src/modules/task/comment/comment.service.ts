import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Role } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { SendCommentInput } from './inputs/send-comment.input'

@Injectable()
export class CommentService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findComments(taskId: string) {
		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const comments = await this.prismaService.comment.findMany({
			where: {
				taskId: task.id
			},
			include: {
				author: true
			},
			orderBy: {
				createdAt: 'asc'
			}
		})

		return comments
	}

	public async sendComment(userId: string, input: SendCommentInput) {
		const { taskId, content } = input

		const task = await this.prismaService.task.findUnique({
			where: {
				id: taskId
			}
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const comment = await this.prismaService.comment.create({
			data: {
				content,
				task: {
					connect: {
						id: taskId
					}
				},
				author: {
					connect: {
						id: userId
					}
				}
			},
			include: {
				author: true
			}
		})

		return comment
	}

	public async deleteComment(userId: string, commentId: string) {
		const comment = await this.prismaService.comment.findUnique({
			where: { id: commentId },
			include: { task: true }
		})

		if (!comment) {
			throw new NotFoundException('Comment not found')
		}

		const membership = await this.prismaService.member.findUnique({
			where: {
				userId_projectId: {
					userId: userId,
					projectId: comment.task.projectId
				}
			}
		})

		const isAdmin = membership?.role === Role.ADMIN
		const isAuthor = comment.authorId === userId

		if (!isAdmin && !isAuthor) {
			throw new BadRequestException('You can only delete your own comments')
		}

		await this.prismaService.comment.delete({
			where: { id: commentId }
		})

		return true
	}
}
