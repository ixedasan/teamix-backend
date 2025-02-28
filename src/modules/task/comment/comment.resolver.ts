import { Inject, UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { Role } from '@/prisma/generated'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { CommentService } from './comment.service'
import { SendCommentInput } from './inputs/send-comment.input'
import { UpdateCommentInput } from './inputs/update-comment.input'
import {
	CommentSubscriptionPayload,
	MutationType
} from './models/comment-subscription.model'
import { CommentModel } from './models/comment.model'

@Resolver('Comment')
export class CommentResolver {
	public constructor(
		@Inject('PUB_SUB') private readonly pubSub: RedisPubSub,
		private readonly commentService: CommentService
	) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [CommentModel], { name: 'findCommentsByTask' })
	public async findComments(@Args('taskId') taskId: string) {
		return this.commentService.findComments(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => CommentModel, { name: 'sendComment' })
	public async sendComment(
		@Authorized('id') userId: string,
		@Args('data') input: SendCommentInput
	) {
		const comment = await this.commentService.sendComment(userId, input)

		await this.pubSub.publish('COMMENT_CHANGED', {
			commentChanged: { mutation: MutationType.CREATED, comment }
		})

		return comment
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => CommentModel, { name: 'updateComment' })
	public async updateComment(
		@Authorized('id') userId: string,
		@Args('data') input: UpdateCommentInput
	) {
		const comment = await this.commentService.updateComment(userId, input)

		await this.pubSub.publish('COMMENT_CHANGED', {
			commentChanged: { mutation: MutationType.UPDATED, comment }
		})

		return comment
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => Boolean, { name: 'deleteComment' })
	public async deleteComment(
		@Authorized('id') userId: string,
		@Args('commentId') commentId: string
	) {
		const deletedComment = await this.commentService.deleteComment(
			userId,
			commentId
		)

		if (deletedComment) {
			await this.pubSub.publish('COMMENT_CHANGED', {
				commentChanged: {
					mutation: MutationType.DELETED,
					comment: deletedComment
				}
			})
		}

		return true
	}

	@Subscription(() => CommentSubscriptionPayload, {
		filter: (payload, variables) =>
			payload.commentChanged.comment.taskId === variables.taskId
	})
	public commentChanged(@Args('taskId') taskId: string) {
		return this.pubSub.asyncIterator('COMMENT_CHANGED')
	}
}
