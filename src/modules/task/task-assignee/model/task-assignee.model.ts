import { Field, ID, ObjectType } from '@nestjs/graphql'
import { TaskAssignee } from '@/prisma/generated'
import { UserModel } from '../../../auth/account/models/user.models'
import { TaskModel } from '../../../tasks/task/models/task.model'

@ObjectType()
export class TaskAssigneeModel implements TaskAssignee {
	@Field(() => ID)
	public id: string

	@Field(() => ID)
	public taskId: string

	@Field(() => TaskModel)
	public task: TaskModel

	@Field(() => ID)
	public userId: string

	@Field(() => UserModel)
	public user: UserModel

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
