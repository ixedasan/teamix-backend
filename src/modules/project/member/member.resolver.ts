import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Role } from '@/prisma/generated'
import { Authorization } from '@/src/shared/decorators/auth.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { InviteMemberInput } from './inputs/invite-member.input'
import { MemberService } from './member.service'

@Resolver('Member')
export class MemberResolver {
	public constructor(private readonly memberService: MemberService) {}

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
}
