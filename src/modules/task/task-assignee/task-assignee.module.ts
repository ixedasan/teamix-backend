import { Module } from '@nestjs/common'
import { NotificationService } from '../../notification/notification.service'
import { TaskAssigneeResolver } from './task-assignee.resolver'
import { TaskAssigneeService } from './task-assignee.service'

@Module({
	providers: [TaskAssigneeResolver, TaskAssigneeService, NotificationService]
})
export class TaskAssigneeModule {}
