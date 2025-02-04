import { Module } from '@nestjs/common'
import { NotificationService } from '../../notification/notification.service'
import { TaskResolver } from '../task/task.resolver'
import { TaskService } from '../task/task.service'
import { TaskAssigneeResolver } from './task-assignee.resolver'
import { TaskAssigneeService } from './task-assignee.service'

@Module({
	providers: [
		TaskAssigneeResolver,
		TaskAssigneeService,
		NotificationService,
		TaskService,
		TaskResolver
	]
})
export class TaskAssigneeModule {}
