import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { Member, Role } from '@/prisma/generated'

@ObjectType()
export class MemberModel implements Member {
	@Field(() => ID)
	public id: string

	@Field(() => ID)
	public userId: string

	@Field(() => ID)
	public projectId: string

	@Field(() => String)
	public role: Role

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
