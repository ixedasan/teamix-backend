import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { ProjectPlan, type Project } from '@/prisma/generated'
import { TaskLabelModel } from '@/src/modules/task/task-labels/models/task-labels.model'
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
	public icon: string

	@Field(() => String, { nullable: true })
	public description: string

	@Field(() => String, { nullable: true })
	public cover: string

	@Field(() => [MemberModel])
	public members: MemberModel[]

	@Field(() => [TaskLabelModel])
	public labels: TaskLabelModel[]

	@Field(() => ProjectPlan)
	public plan: ProjectPlan

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
