import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Role, TokenType, type Project, type User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { MailService } from '../../libs/mail/mail.service'
import { TelegramService } from '../../libs/telegram/telegram.service'
import { NotificationService } from '../../notification/notification.service'
import { ChangeRoleInput } from './inputs/change-role.input'
import { InviteMemberInput } from './inputs/invite-member.input'

@Injectable()
export class MemberService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService,
		private readonly notificationService: NotificationService,
		private readonly telegramService: TelegramService
	) {}

	public async getProjectMembers(projectId: string) {
		const members = await this.prismaService.member.findMany({
			where: {
				projectId
			},
			include: {
				user: true
			}
		})

		return members
	}

	public async inviteMember(project: Project, input: InviteMemberInput) {
		const { email, role } = input

		const existingMember = await this.prismaService.member.findFirst({
			where: {
				projectId: project.id,
				user: {
					email
				}
			}
		})

		if (existingMember) {
			throw new BadRequestException('Member already exists')
		}

		const inviteToken = await this.generateInviteToken(email, project.id, role)

		await this.mailService.sendInviteMemberToken(
			email,
			project.name,
			inviteToken.token
		)

		const user = await this.prismaService.user.findFirst({
			where: {
				email
			},
			include: {
				notificationSettings: true
			}
		})

		if (user.notificationSettings.siteNotification) {
			await this.notificationService.createProjectInvitationNotification(
				user.id,
				project.name
			)
		}

		if (
			user.notificationSettings.telegramNotification &&
			user.telegramId &&
			inviteToken
		) {
			await this.telegramService.sendProjectInvitation(
				user.telegramId,
				project.name,
				inviteToken.role,
				inviteToken.token
			)
		}

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
			await this.prismaService.token.delete({
				where: {
					id: inviteToken.id
				}
			})

			throw new UnauthorizedException('Token not found')
		}

		if (new Date(inviteToken.expiresIn) < new Date()) {
			throw new BadRequestException('Invitation token has expired')
		}

		const user = await this.prismaService.user.findFirst({
			where: {
				email: inviteToken.email
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		try {
			await this.prismaService.$transaction(async prisma => {
				await prisma.member.create({
					data: {
						role: inviteToken.role,
						userId: user.id,
						projectId: inviteToken.projectId
					}
				})

				await prisma.token.delete({
					where: { id: inviteToken.id }
				})
			})

			return true
		} catch (error) {
			throw new BadRequestException(`Failed to accept invitation: ${error}`)
		}
	}

	public async changeMemberRole(
		user: User,
		projectId: string,
		input: ChangeRoleInput
	) {
		const { userId, role } = input

		const member = await this.prismaService.member.findUnique({
			where: {
				userId_projectId: {
					projectId,
					userId
				}
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
		const member = await this.prismaService.member.findUnique({
			where: {
				userId_projectId: {
					projectId: id,
					userId: memberId
				}
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
				email,
				projectId
			}
		})

		if (existingToken) {
			await this.prismaService.token.delete({
				where: { id: existingToken.id }
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
