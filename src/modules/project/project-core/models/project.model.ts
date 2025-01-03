import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { Project } from '@/prisma/generated'

@ObjectType()
export class ProjectModel implements Project {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public name: string

	@Field(() => String, { nullable: true })
	public description: string

	@Field(() => String, { nullable: true })
	public cover: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
