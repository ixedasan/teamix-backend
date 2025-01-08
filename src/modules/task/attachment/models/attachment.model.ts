import { Field, ID, ObjectType } from '@nestjs/graphql'
import { Attachment } from '@/prisma/generated'

@ObjectType()
export class AttachmentModel implements Attachment {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public filename: string

	@Field(() => String)
	public filepath: string

	@Field(() => String)
	public mimeType: string

	@Field(() => Number)
	public size: number

	@Field(() => ID)
	public taskId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
