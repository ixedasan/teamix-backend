import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Role } from '@/prisma/generated'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { TaskAssigneeModel } from './model/task-assignee.model'
import { TaskAssigneeService } from './task-assignee.service'

@Resolver('TaskAssignee')
export class TaskAssigneeResolver {
	public constructor(
		private readonly taskAssigneeService: TaskAssigneeService
	) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [TaskAssigneeModel], { name: 'getTaskAssignees' })
	public async getTaskAssignees(@Args('taskId') taskId: string) {
		return this.taskAssigneeService.getTaskAssignees(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'assignTask' })
	public async assignTask(
		@Args('taskId') taskId: string,
		@Args('userId') userId: string
	) {
		return this.taskAssigneeService.assignTask(taskId, userId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'unassignTask' })
	public async unassignTask(
		@Args('taskId') taskId: string,
		@Args('userId') userId: string
	) {
		return this.taskAssigneeService.unassignTask(taskId, userId)
	}
}
