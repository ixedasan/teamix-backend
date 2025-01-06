import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql'
import { PubSub } from 'graphql-subscriptions'
import { Role, type Project, type User } from '@/prisma/generated'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { ChangeStatusInput } from './inputs/change-status.input'
import { TaskInput } from './inputs/task.input'
import { TaskModel } from './models/task.model'
import { TaskService } from './task.service'

@Resolver('Task')
export class TaskResolver {
	private readonly pubSub: PubSub

	public constructor(private readonly taskService: TaskService) {
		this.pubSub = new PubSub()
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => TaskModel, { name: 'findTask' })
	public async findTask(@Args('taskId') taskId: string) {
		return this.taskService.findTask(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [TaskModel], { name: 'findAllTasks' })
	public async findTasks(@CurrentProject('id') projectId: string) {
		return this.taskService.findTasks(projectId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => TaskModel, { name: 'createTask' })
	public async createTask(
		@Authorized() user: User,
		@CurrentProject() project: Project,
		@Args('input') input: TaskInput
	) {
		const task = await this.taskService.createTask(user, project, input)

		this.pubSub.publish('TASK_CHANGED', { taskChanged: task })

		return task
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => TaskModel, { name: 'updateTask' })
	public async updateTask(
		@Authorized() user: User,
		@Args('taskId') taskId: string,
		@Args('input') input: TaskInput
	) {
		const task = await this.taskService.updateTask(user, taskId, input)

		this.pubSub.publish('TASK_CHANGED', { taskChanged: task })

		return task
	}

	@Subscription(() => TaskModel, {
		name: 'taskChanged',
		filter: (payload, variables) =>
			payload.taskChanged.projectId === variables.projectId
	})
	public taskChanged(@Args('projectId') projectId: string) {
		return this.pubSub.asyncIterableIterator('TASK_CHANGED')
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'deleteTask' })
	public async deleteTask(@Args('taskId') taskId: string) {
		return this.taskService.deleteTask(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'changeTaskStatus' })
	public async changeTaskStatus(@Args('input') input: ChangeStatusInput) {
		return this.taskService.changeTaskStatus(input)
	}
}
