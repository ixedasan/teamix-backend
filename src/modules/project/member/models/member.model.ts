import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { Member, Role } from '@/prisma/generated'
import { UserModel } from '@/src/modules/auth/account/models/user.models'
import { ProjectModel } from '../../project-core/models/project.model'

registerEnumType(Role, {
	name: 'Role',
	description: 'User role in project'
})

@ObjectType()
export class MemberModel implements Member {
	@Field(() => ID)
	public id: string

	@Field(() => ID)
	public userId: string

	@Field(() => UserModel)
	public user: UserModel

	@Field(() => ID)
	public projectId: string

	@Field(() => ProjectModel)
	public project: ProjectModel

	@Field(() => Role)
	public role: Role

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
