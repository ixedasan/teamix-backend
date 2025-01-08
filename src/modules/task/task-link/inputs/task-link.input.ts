import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator'

@InputType()
export class TaskLinkInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@IsUrl()
	public url: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	public title?: string
}
