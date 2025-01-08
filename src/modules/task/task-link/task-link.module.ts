import { Module } from '@nestjs/common'
import { TaskLinkResolver } from './task-link.resolver'
import { TaskLinkService } from './task-link.service'

@Module({
	providers: [TaskLinkResolver, TaskLinkService]
})
export class TaskLinkModule {}
