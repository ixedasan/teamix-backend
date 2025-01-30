import { Inject, UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { Role, type Project, type Task, type User } from '@/prisma/generated'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { ChangeStatusInput } from './inputs/change-status.input'
import { TaskInput } from './inputs/task.input'
import { TaskModel } from './models/task.model'
import { TaskService } from './task.service'

enum EVENTS {
	TASK_ADDED = 'TASK_ADDED',
	TASK_CHANGED = 'TASK_CHANGED',
	TASK_DELETED = 'TASK_DELETED'
}

@Resolver('Task')
export class TaskResolver {
	public constructor(
		private readonly taskService: TaskService,
		@Inject('PUB_SUB') private readonly pubSub: RedisPubSub
	) {}

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
		await this.publishTaskAdded(task)
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
		await this.publishTaskChanged(task)
		return task
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => TaskModel, { name: 'deleteTask' })
	public async deleteTask(@Args('taskId') taskId: string) {
		const result = await this.taskService.deleteTask(taskId)
		await this.publishTaskDeleted(result)
		return result
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => TaskModel, { name: 'changeTaskStatus' })
	public async changeTaskStatus(@Args('input') input: ChangeStatusInput) {
		const task = await this.taskService.changeTaskStatus(input)
		await this.publishTaskChanged(task)
		return task
	}

	@Subscription(() => TaskModel, {
		name: 'taskAdded',
		filter: (payload, variables) => {
			return payload.taskAdded.projectId === variables.projectId
		},
		resolve: payload => payload.taskAdded
	})
	public taskAdded(@Args('projectId') projectId: string) {
		return this.pubSub.asyncIterableIterator(EVENTS.TASK_ADDED)
	}

	private async publishTaskAdded(task: Task) {
		await this.pubSub.publish(EVENTS.TASK_ADDED, { taskAdded: task })
	}

	@Subscription(() => TaskModel, {
		name: 'taskChanged',
		filter: (payload, variables) => {
			return payload.taskChanged.projectId === variables.projectId
		},
		resolve: payload => payload.taskChanged
	})
	public taskChanged(@Args('projectId') projectId: string) {
		return this.pubSub.asyncIterableIterator(EVENTS.TASK_CHANGED)
	}

	private async publishTaskChanged(task: Task) {
		await this.pubSub.publish(EVENTS.TASK_CHANGED, { taskChanged: task })
	}

	@Subscription(() => TaskModel, {
		name: 'taskDeleted',
		filter: (payload, variables) => {
			return payload.taskDeleted.projectId === variables.projectId
		},
		resolve: payload => payload.taskDeleted
	})
	public taskDeleted(@Args('projectId') projectId: string) {
		return this.pubSub.asyncIterableIterator(EVENTS.TASK_DELETED)
	}

	private async publishTaskDeleted(task: Task) {
		await this.pubSub.publish(EVENTS.TASK_DELETED, { taskDeleted: task })
	}
}
