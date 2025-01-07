import { Field, InputType } from '@nestjs/graphql'
import { IsString, MaxLength } from 'class-validator'

@InputType()
export class CreateDocumentInput {
	@Field(() => String)
	@IsString()
	@MaxLength(150)
	public title: string
}
