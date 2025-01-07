import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

@InputType()
export class CreateLabelInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	public name: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public color: string
}
