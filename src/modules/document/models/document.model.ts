import { Field, ID, ObjectType } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'
import { type Document } from '@/prisma/generated'

@ObjectType()
export class DocumentModel implements Document {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public title: string

	@Field(() => GraphQLJSON, { nullable: true })
	public content: any

	@Field(() => String)
	public projectId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
