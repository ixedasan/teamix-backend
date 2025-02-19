import { Inject, UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { Role } from '@/prisma/generated'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { TaskModel } from '../task/models/task.model'
import { TaskResolver } from '../task/task.resolver'
import { CreateLabelInput } from './inputs/create-label.input'
import { TaskLabelModel } from './models/task-labels.model'
import { TaskLabelsService } from './task-labels.service'

@Resolver('TaskLabel')
export class TaskLabelsResolver {
	public constructor(
		private readonly taskLabelsService: TaskLabelsService,
		private readonly taskResolver: TaskResolver,
		@Inject('PUB_SUB') private readonly pubSub: RedisPubSub
	) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [TaskLabelModel], { name: 'findTaskLabelsByProject' })
	public async getLabels(@CurrentProject('id') projectId: string) {
		return this.taskLabelsService.getProjectLabels(projectId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [TaskLabelModel], { name: 'findTaskLabelsByTask' })
	public async getTaskLabels(@Args('taskId') taskId: string) {
		return this.taskLabelsService.getTaskLabels(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => TaskLabelModel, { name: 'createTaskLabel' })
	public async createLabel(
		@CurrentProject('id') projectId: string,
		@Args('input') input: CreateLabelInput
	) {
		return this.taskLabelsService.createLabel(projectId, input)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => TaskModel, { name: 'addLabelToTask' })
	public async addLabelToTask(
		@Args('taskId') taskId: string,
		@Args('labelId') labelId: string
	) {
		const task = await this.taskLabelsService.addLabelToTask(taskId, labelId)
		await this.taskResolver.publishTaskChanged(task)
		return task
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => TaskModel, { name: 'removeLabelFromTask' })
	public async removeLabelFromTask(
		@Args('taskId') taskId: string,
		@Args('labelId') labelId: string
	) {
		const task = await this.taskLabelsService.removeLabelFromTask(
			taskId,
			labelId
		)
		await this.taskResolver.publishTaskChanged(task)
		return task
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'deleteTaskLabel' })
	public async deleteLabel(@Args('labelId') labelId: string) {
		return this.taskLabelsService.deleteLabel(labelId)
	}
}
