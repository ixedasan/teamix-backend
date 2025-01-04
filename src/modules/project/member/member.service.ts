import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Role, TokenType, User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { MailService } from '../../libs/mail/mail.service'
import { ChangeRoleInput } from './inputs/change-role.input'
import { InviteMemberInput } from './inputs/invite-member.input'

@Injectable()
export class MemberService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService
	) {}

	public async getProjectMembers(id: string) {
		const members = await this.prismaService.member.findMany({
			where: {
				projectId: id
			},
			include: {
				user: true
			}
		})

		return members
	}

	public async inviteMember(id: string, input: InviteMemberInput) {
		const { email, role } = input

		const existingMember = await this.prismaService.member.findFirst({
			where: {
				projectId: id,
				user: {
					email
				}
			}
		})

		if (existingMember) {
			throw new BadRequestException('Member already exists')
		}

		const project = await this.prismaService.project.findUnique({
			where: {
				id
			}
		})

		if (!project) {
			throw new NotFoundException('Project not found')
		}

		const inviteToken = await this.generateInviteToken(email, id, role)

		await this.mailService.sendInviteMemberToken(
			email,
			project.name,
			inviteToken.token
		)

		return true
	}

	public async acceptInvitation(token: string) {
		const inviteToken = await this.prismaService.token.findFirst({
			where: {
				token,
				type: TokenType.INVITATION
			}
		})

		if (!inviteToken) {
			throw new NotFoundException('Token not found')
		}

		const user = await this.prismaService.user.findFirst({
			where: {
				email: inviteToken.email
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		await this.prismaService.member.create({
			data: {
				role: inviteToken.role,
				userId: user.id,
				projectId: inviteToken.projectId
			}
		})

		await this.prismaService.token.delete({
			where: {
				id: inviteToken.id
			}
		})

		return true
	}

	public async changeMemberRole(user: User, input: ChangeRoleInput) {
		const { projectId, userId, role } = input

		const project = await this.prismaService.project.findUnique({
			where: { id: projectId }
		})

		if (!project) {
			throw new NotFoundException('Project not found!')
		}

		const member = await this.prismaService.member.findFirst({
			where: {
				projectId,
				userId
			}
		})

		if (!member) {
			throw new NotFoundException('Member not found')
		}

		if (member.userId === user.id) {
			throw new BadRequestException('Cannot change your own role')
		}

		await this.prismaService.member.update({
			where: {
				id: member.id
			},
			data: {
				role
			}
		})

		return true
	}

	public async removeMember(id: string, memberId: string) {
		const member = await this.prismaService.member.findFirst({
			where: {
				projectId: id,
				userId: memberId
			}
		})

		if (!member) {
			throw new NotFoundException('Member not found')
		}

		const projectMembers = await this.getProjectMembers(id)
		if (projectMembers.length === 1) {
			throw new BadRequestException(
				'Cannot remove the last member from the project'
			)
		}

		await this.prismaService.member.delete({
			where: {
				id: member.id
			}
		})

		return true
	}

	private async generateInviteToken(
		email: string,
		projectId: string,
		role: Role
	) {
		const token = uuidv4()

		const expiresIn = new Date(new Date().getTime() + 1000 * 60 * 60 * 24)

		const existingToken = await this.prismaService.token.findFirst({
			where: {
				type: TokenType.INVITATION,
				email
			}
		})

		if (existingToken) {
			await this.prismaService.token.delete({
				where: {
					id: existingToken.id
				}
			})
		}

		const newToken = await this.prismaService.token.create({
			data: {
				token,
				expiresIn,
				type: TokenType.INVITATION,
				role,
				email,
				projectId
			}
		})

		return newToken
	}
}
