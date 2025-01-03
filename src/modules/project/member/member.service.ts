import { Injectable, NotFoundException } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Role, TokenType } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { MailService } from '../../libs/mail/mail.service'
import { InviteMemberInput } from './inputs/invite-member.input'

@Injectable()
export class MemberService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService
	) {}

	public async inviteMember(id: string, input: InviteMemberInput) {
		const { email, role } = input

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
				user: {
					connect: {
						id: user.id
					}
				},
				project: {
					connect: {
						id: inviteToken.projectId
					}
				}
			}
		})

		await this.prismaService.token.delete({
			where: {
				id: inviteToken.id
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
