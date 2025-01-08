import { Module } from '@nestjs/common'
import { TaskAssigneeResolver } from './task-assignee.resolver'
import { TaskAssigneeService } from './task-assignee.service'

@Module({
	providers: [TaskAssigneeResolver, TaskAssigneeService]
})
export class TaskAssigneeModule {}
