import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Role } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'

@Injectable()
export class GqlRoleGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly prisma: PrismaService
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
			context.getHandler(),
			context.getClass()
		])

		if (requiredRoles && requiredRoles.length === 0) {
			return true
		}

		const ctx = GqlExecutionContext.create(context)
		const request = ctx.getContext().req

		if (typeof request.session.userId === 'undefined') {
			throw new UnauthorizedException('User not authenticated')
		}

		const user = await this.prisma.user.findUnique({
			where: {
				id: request.session.userId
			}
		})
		if (!user) {
			throw new UnauthorizedException('User not found')
		}

		const args = ctx.getArgs()

		const projectId = await this.resolveProjectId(args)

		if (!projectId) {
			if (requiredRoles && requiredRoles.length > 0) {
				throw new ForbiddenException('Project not found!')
			}

			return true
		}

		const member = await this.prisma.member.findUnique({
			where: {
				userId_projectId: {
					userId: user.id,
					projectId: projectId
				}
			}
		})

		if (!member) {
			throw new ForbiddenException('You are not a member of this project!')
		}

		if (requiredRoles && !requiredRoles.includes(member.role)) {
			throw new ForbiddenException('You do not have permission!')
		}

		request.user = user
		return true
	}

	private async resolveProjectId(args: any): Promise<string | null> {
		if (args && args.projectId) {
			return args.projectId
		}

		if (args && args.taskId) {
			const task = await this.prisma.task.findUnique({
				where: { id: args.taskId },
				select: { projectId: true }
			})
			return task?.projectId || null
		}

		if (args && args.documentId) {
			const document = await this.prisma.document.findUnique({
				where: { id: args.documentId },
				select: { projectId: true }
			})
			return document?.projectId || null
		}

		if (args && args.id) {
			const project = await this.prisma.project.findUnique({
				where: { id: args.id },
				select: { id: true }
			})
			return project?.id || null
		}

		return null
	}
}
