import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Role, type Project, type User } from '@/prisma/generated'
import { Authorization } from '@/src/shared/decorators/auth.decorator'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { ChangeRoleInput } from './inputs/change-role.input'
import { InviteMemberInput } from './inputs/invite-member.input'
import { MemberService } from './member.service'
import { MemberModel } from './models/member.model'

@Resolver('Member')
export class MemberResolver {
	public constructor(private readonly memberService: MemberService) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [MemberModel], { name: 'findProjectMembers' })
	public async getProjectMembers(@CurrentProject('id') projectId: string) {
		return this.memberService.getProjectMembers(projectId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'inviteProjectMember' })
	public async inviteMember(
		@CurrentProject() project: Project,
		@Args('data') input: InviteMemberInput
	) {
		return this.memberService.inviteMember(project, input)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'acceptProjectInvitation' })
	public async acceptInvitation(@Args('token') token: string) {
		return this.memberService.acceptInvitation(token)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'changeMemberRole' })
	public async changeRole(
		@Authorized() user: User,
		@CurrentProject('id') projectId: string,
		@Args('data') input: ChangeRoleInput
	) {
		return this.memberService.changeMemberRole(user, projectId, input)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'removeProjectMember' })
	public async removeMember(
		@CurrentProject('id') projectId: string,
		@Args('userId') userId: string
	) {
		return this.memberService.removeMember(projectId, userId)
	}
}
