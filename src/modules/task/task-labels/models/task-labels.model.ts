import { Field, ID, ObjectType } from '@nestjs/graphql'
import { type TaskLabel } from '@/prisma/generated'

@ObjectType()
export class TaskLabelModel implements TaskLabel {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public name: string

	@Field(() => String)
	public color: string

	@Field(() => ID)
	public projectId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
