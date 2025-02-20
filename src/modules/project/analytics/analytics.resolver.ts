import { UseGuards } from '@nestjs/common'
import { Args, Int, Query, Resolver } from '@nestjs/graphql'
import { ProjectPlan } from '@/prisma/generated'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { ProjectPlanAccess } from '@/src/shared/decorators/project-plan-access'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { AnalyticsService, Period } from './analytics.service'
import {
	ProjectStatistics,
	TaskStatistics,
	UserActivityStatistics
} from './models/analytics.model'

@UseGuards(GqlAuthGuard, ProjectGuard)
@ProjectPlanAccess(ProjectPlan.PRO, ProjectPlan.ENTERPRISE)
@Resolver('Analytics')
export class AnalyticsResolver {
	public constructor(private readonly analyticsService: AnalyticsService) {}

	@Query(() => ProjectStatistics, { name: 'findProjectStatistics' })
	public async findProjectStatistics(
		@CurrentProject('id') projectId: string,
		@Args('period') period: Period
	) {
		return this.analyticsService.getProjectStatistics(projectId, period)
	}

	@Query(() => TaskStatistics, { name: 'findTaskStatistics' })
	public async findTaskStatistics(@CurrentProject('id') projectId: string) {
		return this.analyticsService.getTaskStatistics(projectId)
	}

	@Query(() => UserActivityStatistics, { name: 'findMemberStatistics' })
	public async findMemberStatistics(
		@CurrentProject('id') projectId: string,
		@Args('days', { type: () => Int, defaultValue: 30 }) days: number
	) {
		return this.analyticsService.getUserActivityStatistics(projectId, days)
	}
}
