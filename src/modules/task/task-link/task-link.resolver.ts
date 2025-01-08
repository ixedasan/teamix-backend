import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Role } from '@/prisma/generated'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { TaskLinkInput } from './inputs/task-link.input'
import { TaskLinkModel } from './models/task-link.model'
import { TaskLinkService } from './task-link.service'

@Resolver('TaskLink')
export class TaskLinkResolver {
	public constructor(private readonly taskLinkService: TaskLinkService) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [TaskLinkModel], { name: 'findTaskLinks' })
	public async getTaskLinks(@Args('taskId') taskId: string) {
		return this.taskLinkService.getTaskLinks(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'createTaskLink' })
	public async createTaskLink(
		@Args('taskId') taskId: string,
		@Args('input') input: TaskLinkInput
	) {
		return this.taskLinkService.createTaskLink(taskId, input)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'updateTaskLink' })
	public async updateTaskLink(
		@Args('linkId') linkId: string,
		@Args('input') input: TaskLinkInput
	) {
		return this.taskLinkService.updateTaskLink(linkId, input)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'deleteTaskLink' })
	public async deleteTaskLink(@Args('linkId') linkId: string) {
		return this.taskLinkService.deleteTaskLink(linkId)
	}
}
