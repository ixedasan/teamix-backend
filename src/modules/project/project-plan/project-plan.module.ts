import { Module } from '@nestjs/common'
import { ProjectPlanResolver } from './project-plan.resolver'
import { ProjectPlanService } from './project-plan.service'

@Module({
	providers: [ProjectPlanResolver, ProjectPlanService]
})
export class ProjectPlanModule {}
