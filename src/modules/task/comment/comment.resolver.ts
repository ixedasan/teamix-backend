import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql'
import { PubSub } from 'graphql-subscriptions'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { CommentService } from './comment.service'
import { SendCommentInput } from './inputs/send-comment.input'
import { CommentModel } from './models/comment.model'

@Resolver('Comment')
export class CommentResolver {
	private readonly pubSub: PubSub

	public constructor(private readonly commentService: CommentService) {
		this.pubSub = new PubSub()
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [CommentModel], { name: 'findCommentsByTask' })
	public async findComments(@Args('taskId') taskId: string) {
		return this.commentService.findComments(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => CommentModel, { name: 'sendComment' })
	public async sendComment(
		@Authorized('id') userId: string,
		@Args('input') input: SendCommentInput
	) {
		const comment = await this.commentService.sendComment(userId, input)

		this.pubSub.publish('COMMENT_ADDED', { commentAdded: comment })

		return comment
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => Boolean, { name: 'deleteComment' })
	public async deleteComment(
		@Authorized('id') userId: string,
		@Args('commentId') commentId: string
	) {
		return this.commentService.deleteComment(userId, commentId)
	}

	@Subscription(() => CommentModel, {
		filter: (payload, variables) =>
			payload.commentAdded.taskId === variables.taskId
	})
	public commentAdded(@Args('taskId') taskId: string) {
		return this.pubSub.asyncIterableIterator('COMMENT_ADDED')
	}
}
