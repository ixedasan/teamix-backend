import { Args, Query, Resolver } from '@nestjs/graphql'
import { Authorization } from '@/src/shared/decorators/auth.decorator'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { TaskModel } from '../task/task/models/task.model'
import { DashboardService } from './dashboard.service'
import { DashboardFilterInput, TaskFilterInput } from './inputs/dashboard.input'
import {
	DashboardSummaryModel,
	ProjectTasksSummaryModel
} from './models/dashboard.model'

@Authorization()
@Resolver('Dashboard')
export class DashboardResolver {
	public constructor(private readonly dashboardService: DashboardService) {}

	@Query(() => DashboardSummaryModel, { name: 'FindUserDashboard' })
	public async dashboardSummary(
		@Authorized('id') userId: string,
		@Args('filter', { nullable: true }) filter?: DashboardFilterInput
	) {
		return this.dashboardService.getDashboardSummary(userId, filter)
	}

	@Query(() => [TaskModel], { name: 'FindUserAssigedTasks' })
	public async assignedTasks(
		@Authorized('id') userId: string,
		@Args('filter', { nullable: true }) filter?: TaskFilterInput
	) {
		return this.dashboardService.getAssignedTasks(userId, filter)
	}

	@Query(() => [TaskModel], { name: 'FindUserCreatedTasks' })
	public async createdTasks(
		@Authorized('id') userId: string,
		@Args('filter', { nullable: true }) filter?: TaskFilterInput
	) {
		return this.dashboardService.getCreatedTasks(userId, filter)
	}

	@Query(() => [TaskModel], { name: 'FindUserOverdueTasks' })
	public async overdueTasks(
		@Authorized('id') userId: string,
		@Args('filter', { nullable: true }) filter?: TaskFilterInput
	) {
		return this.dashboardService.getOverdueTasks(userId, filter)
	}

	@Query(() => [TaskModel], { name: 'FindUserUpcomingTasks' })
	public async upcomingTasks(
		@Authorized('id') userId: string,
		@Args('filter', { nullable: true }) filter?: TaskFilterInput
	) {
		return this.dashboardService.getUpcomingTasks(userId, filter)
	}

	@Query(() => [ProjectTasksSummaryModel], {
		name: 'FindUserProjectsTasksSummary'
	})
	public async projectsTasksSummary(
		@Authorized('id') userId: string,
		@Args('projectIds', { type: () => [String], nullable: true })
		projectIds?: string[]
	) {
		return this.dashboardService.getProjectsTasksSummary(userId, projectIds)
	}
}
