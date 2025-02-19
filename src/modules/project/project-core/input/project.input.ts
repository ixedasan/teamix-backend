import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

@InputType()
export class ProjectInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public name: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	public icon?: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	@MaxLength(300)
	public description?: string
}
