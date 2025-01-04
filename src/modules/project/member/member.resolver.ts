import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Role, User } from '@/prisma/generated'
import { Authorization } from '@/src/shared/decorators/auth.decorator'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { ChangeRoleInput } from './inputs/change-role.input'
import { InviteMemberInput } from './inputs/invite-member.input'
import { MemberService } from './member.service'
import { MemberModel } from './models/member.model'

@Resolver('Member')
export class MemberResolver {
	public constructor(private readonly memberService: MemberService) {}

	@Authorization()
	@Query(() => [MemberModel], { name: 'getProjectMembers' })
	public async getProjectMembers(@Args('projectId') id: string) {
		return this.memberService.getProjectMembers(id)
	}

	@Authorization()
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'inviteProjectMember' })
	public async inviteMember(
		@Args('projectId') id: string,
		@Args('data') input: InviteMemberInput
	) {
		return this.memberService.inviteMember(id, input)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'acceptProjectInvitation' })
	public async acceptInvitation(@Args('token') token: string) {
		return this.memberService.acceptInvitation(token)
	}

	@Authorization()
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'changeMemberRole' })
	public async changeRole(
		@Authorized() user: User,
		@Args('data') input: ChangeRoleInput
	) {
		return this.memberService.changeMemberRole(user, input)
	}

	@Authorization()
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'removeProjectMember' })
	public async removeMember(
		@Args('projectId') projectId: string,
		@Args('userId') userId: string
	) {
		return this.memberService.removeMember(projectId, userId)
	}
}
