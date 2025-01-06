import { Module } from '@nestjs/common'
import { PubSubModule } from '../../libs/pubsub/pubsub.module'
import { TaskResolver } from './task.resolver'
import { TaskService } from './task.service'

@Module({
	imports: [PubSubModule],
	providers: [TaskResolver, TaskService]
})
export class TaskModule {}
