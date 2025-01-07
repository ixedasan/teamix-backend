import { Field, InputType } from '@nestjs/graphql'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import GraphQLJSON from 'graphql-type-json'

@InputType()
export class ChangeDocumentInput {
	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	@MaxLength(150)
	public title: string

	@Field(() => GraphQLJSON, { nullable: true })
	public content: any
}
