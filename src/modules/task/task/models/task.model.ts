import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { Priority, TaskStatus, type Task } from '@/prisma/generated'
import { UserModel } from '@/src/modules/auth/account/models/user.models'
import { ProjectModel } from '@/src/modules/project/project-core/models/project.model'
import { CommentModel } from '@/src/modules/task/comment/models/comment.model'
import { TaskAssigneeModel } from '@/src/modules/task/task-assignee/model/task-assignee.model'
import { TaskLabelModel } from '../../task-labels/models/task-labels.model'

registerEnumType(TaskStatus, {
	name: 'TaskStatus'
})

registerEnumType(Priority, {
	name: 'Priority'
})

@ObjectType()
export class TaskModel implements Task {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public title: string

	@Field(() => String, { nullable: true })
	public description: string

	@Field(() => TaskStatus)
	public status: TaskStatus

	@Field(() => Priority)
	public priority: Priority

	@Field(() => Date, { nullable: true })
	public startDate: Date

	@Field(() => Date, { nullable: true })
	public dueDate: Date

	// !TODO: attachments, labels
	@Field(() => [TaskAssigneeModel])
	public assignees: TaskAssigneeModel[]

	@Field(() => [TaskLabelModel])
	public labels: TaskLabelModel[]

	@Field(() => [CommentModel])
	public comments: CommentModel[]

	@Field(() => ID)
	public createdById: string

	@Field(() => UserModel)
	public createdBy: UserModel

	@Field(() => ID)
	public projectId: string

	@Field(() => ProjectModel)
	public project: ProjectModel

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
