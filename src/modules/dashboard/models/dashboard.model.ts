import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Priority, TaskStatus } from '@/prisma/generated'
import { ProjectModel } from '@/src/modules/project/project-core/models/project.model'
import { TaskModel } from '../../task/task/models/task.model'

@ObjectType()
export class TasksCountByStatusModel {
	@Field(() => TaskStatus)
	status: TaskStatus

	@Field(() => Int)
	count: number
}

@ObjectType()
export class TasksCountByPriorityModel {
	@Field(() => Priority, { nullable: true })
	priority?: Priority

	@Field(() => Int)
	count: number
}

@ObjectType()
export class TasksDueDateModel {
	@Field(() => Int)
	overdue: number

	@Field(() => Int)
	dueToday: number

	@Field(() => Int)
	dueThisWeek: number

	@Field(() => Int)
	upcoming: number

	@Field(() => Int)
	noDueDate: number
}

@ObjectType()
export class ProjectTasksSummaryModel {
	@Field(() => ProjectModel)
	project: ProjectModel

	@Field(() => Int)
	totalTasks: number

	@Field(() => Int)
	completedTasks: number

	@Field(() => Int)
	pendingTasks: number
}

@ObjectType()
export class DashboardSummaryModel {
	@Field(() => Int)
	totalAssignedTasks: number

	@Field(() => [TasksCountByStatusModel])
	tasksByStatus: TasksCountByStatusModel[]

	@Field(() => [TasksCountByPriorityModel])
	tasksByPriority: TasksCountByPriorityModel[]

	@Field(() => TasksDueDateModel)
	tasksByDueDate: TasksDueDateModel

	@Field(() => [ProjectTasksSummaryModel])
	projectsSummary: ProjectTasksSummaryModel[]

	@Field(() => [TaskModel])
	recentTasks: TaskModel[]

	@Field(() => [TaskModel])
	upcomingDeadlines: TaskModel[]
}
