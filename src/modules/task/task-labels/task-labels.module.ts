import { Module } from '@nestjs/common'
import { TaskResolver } from '../task/task.resolver'
import { TaskService } from '../task/task.service'
import { TaskLabelsResolver } from './task-labels.resolver'
import { TaskLabelsService } from './task-labels.service'

@Module({
	providers: [TaskLabelsResolver, TaskLabelsService, TaskService, TaskResolver]
})
export class TaskLabelsModule {}
