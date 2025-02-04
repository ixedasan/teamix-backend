import { Inject, UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { Role } from '@/prisma/generated'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { TaskModel } from '../task/models/task.model'
import { TaskResolver } from '../task/task.resolver'
import { TaskAssigneeModel } from './model/task-assignee.model'
import { TaskAssigneeService } from './task-assignee.service'

@Resolver('TaskAssignee')
export class TaskAssigneeResolver {
	public constructor(
		private readonly taskAssigneeService: TaskAssigneeService,
		private readonly taskResolver: TaskResolver,
		@Inject('PUB_SUB') private readonly pubSub: RedisPubSub
	) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [TaskAssigneeModel], { name: 'getTaskAssignees' })
	public async getTaskAssignees(@Args('taskId') taskId: string) {
		return this.taskAssigneeService.getTaskAssignees(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => TaskModel, { name: 'assignTask' })
	public async assignTask(
		@Args('taskId') taskId: string,
		@Args('userId') userId: string
	) {
		const task = await this.taskAssigneeService.assignTask(taskId, userId)
		await this.taskResolver.publishTaskChanged(task)
		return task
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => TaskModel, { name: 'unassignTask' })
	public async unassignTask(
		@Args('taskId') taskId: string,
		@Args('userId') userId: string
	) {
		const task = await this.taskAssigneeService.unassignTask(taskId, userId)
		await this.taskResolver.publishTaskChanged(task)
		return task
	}
}
