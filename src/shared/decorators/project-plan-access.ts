import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'
import { ProjectPlan } from '@/prisma/generated'
import { ProjectPlanGuard } from '../guards/project-plan.guard'

export function ProjectPlanAccess(...plans: ProjectPlan[]) {
	return applyDecorators(
		SetMetadata('plans', plans),
		UseGuards(ProjectPlanGuard)
	)
}
