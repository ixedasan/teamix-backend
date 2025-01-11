import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { ProjectPlan, type Project } from '@/prisma/generated'
import { MemberModel } from '../../member/models/member.model'

registerEnumType(ProjectPlan, {
	name: 'ProjectStatus'
})
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

	@Field(() => [MemberModel])
	public members: MemberModel[]

	@Field(() => ProjectPlan)
	public plan: ProjectPlan

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
