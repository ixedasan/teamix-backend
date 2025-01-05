import { Module } from '@nestjs/common'
import { ProjectCoreResolver } from './project-core.resolver'
import { ProjectCoreService } from './project-core.service'

@Module({
	providers: [ProjectCoreResolver, ProjectCoreService]
})
export class ProjectCoreModule {}
