import { Field, ID, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

@InputType()
export class UpdateCommentInput {
	@Field(() => ID)
	@IsUUID('4')
	@IsNotEmpty()
	public commentId: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public content: string
}
