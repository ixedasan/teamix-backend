import { Field, ID, ObjectType } from '@nestjs/graphql'
import { type Link } from '@/prisma/generated'

@ObjectType()
export class TaskLinkModel implements Link {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public url: string

	@Field(() => String, { nullable: true })
	public title: string

	@Field(() => ID)
	public taskId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
