import { Module } from '@nestjs/common'
import { TaskLabelsResolver } from './task-labels.resolver'
import { TaskLabelsService } from './task-labels.service'

@Module({
	providers: [TaskLabelsResolver, TaskLabelsService]
})
export class TaskLabelsModule {}
