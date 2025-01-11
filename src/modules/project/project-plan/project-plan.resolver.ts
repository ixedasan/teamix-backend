import { UseGuards } from '@nestjs/common'
import { Mutation, Resolver } from '@nestjs/graphql'
import { type Project, type User } from '@/prisma/generated'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { MakePaymentModel } from './models/make-payment.model'
import { ProjectPlanService } from './project-plan.service'

@Resolver('ProjectPlan')
export class ProjectPlanResolver {
	public constructor(private readonly projectPlanService: ProjectPlanService) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => MakePaymentModel, { name: 'makePayment' })
	public async makePayment(
		@Authorized() user: User,
		@CurrentProject() project: Project
	) {
		return this.projectPlanService.makePayment(user, project)
	}
}
