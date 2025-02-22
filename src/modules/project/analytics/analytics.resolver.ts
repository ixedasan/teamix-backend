import { UseGuards } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { ProjectPlan } from '@/prisma/generated'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { ProjectPlanAccess } from '@/src/shared/decorators/project-plan-access'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { AnalyticsService } from './analytics.service'
import {
	ComprehensiveProjectAnalytics,
	LabelDistribution,
	MemberProductivity,
	PriorityDistribution,
	ProjectActivity,
	ProjectStatistics,
	ProjectTimeline,
	TaskStatusAnalytics,
	TaskTrend
} from './models/analytics.model'

@UseGuards(GqlAuthGuard, ProjectGuard)
@ProjectPlanAccess(ProjectPlan.PRO, ProjectPlan.ENTERPRISE)
@Resolver('Analytics')
export class AnalyticsResolver {
	public constructor(private readonly analyticsService: AnalyticsService) {}

	@Query(() => ProjectStatistics)
	async projectStatistics(@CurrentProject('id') projectId: string) {
		return this.analyticsService.getProjectStatistics(projectId)
	}

	@Query(() => TaskStatusAnalytics)
	async taskStatusDistribution(@CurrentProject('id') projectId: string) {
		return this.analyticsService.getTaskStatusDistribution(projectId)
	}

	@Query(() => [MemberProductivity])
	async memberProductivity(
		@CurrentProject('id') projectId: string,
		@Args('timeframe', { nullable: true }) timeframe?: string
	) {
		return this.analyticsService.getMemberProductivity(projectId, timeframe)
	}

	@Query(() => ProjectActivity)
	async projectActivity(
		@CurrentProject('id') projectId: string,
		@Args('days', { defaultValue: 30 }) days: number
	): Promise<ProjectActivity> {
		return this.analyticsService.getProjectActivity(projectId, days)
	}

	@Query(() => LabelDistribution)
	async labelDistribution(@CurrentProject('id') projectId: string) {
		return this.analyticsService.getLabelDistribution(projectId)
	}

	@Query(() => PriorityDistribution)
	async priorityDistribution(@CurrentProject('id') projectId: string) {
		return this.analyticsService.getPriorityDistribution(projectId)
	}

	@Query(() => [TaskTrend])
	async taskTrends(
		@CurrentProject('id') projectId: string,
		@Args('months', { defaultValue: 3 }) months: number
	) {
		return this.analyticsService.getTaskTrends(projectId, months)
	}

	@Query(() => ProjectTimeline)
	async projectTimeline(@CurrentProject('id') projectId: string) {
		return this.analyticsService.getProjectTimeline(projectId)
	}

	@Query(() => ComprehensiveProjectAnalytics)
	async projectAnalytics(@CurrentProject('id') projectId: string) {
		return this.analyticsService.getComprehensiveProjectAnalytics(projectId)
	}
}
