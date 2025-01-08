import { Field, ID, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

@InputType()
export class SendCommentInput {
	@Field(() => ID)
	@IsUUID('4')
	@IsNotEmpty()
	public taskId: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public content: string
}
