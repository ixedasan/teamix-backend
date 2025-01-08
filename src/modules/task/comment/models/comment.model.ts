import { Field, ID, ObjectType } from '@nestjs/graphql'
import { type Comment } from '@/prisma/generated'
import { UserModel } from '@/src/modules/auth/account/models/user.models'

@ObjectType()
export class CommentModel implements Comment {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public content: string

	@Field(() => ID)
	public authorId: string

	@Field(() => UserModel)
	public author: UserModel

	@Field(() => ID)
	public taskId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
