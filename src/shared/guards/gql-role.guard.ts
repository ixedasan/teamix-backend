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
		private readonly prismaService: PrismaService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
			context.getHandler(),
			context.getClass()
		])

		if (!requiredRoles || requiredRoles.length === 0) {
			return true
		}

		const ctx = GqlExecutionContext.create(context)
		const request = ctx.getContext().req

		if (!request.session.userId) {
			throw new UnauthorizedException('User not authenticated')
		}

		if (!request.session.projectId) {
			throw new ForbiddenException('Project not selected')
		}

		const userId = request.session.userId
		const projectId = request.session.projectId

		const member = await this.prismaService.member.findFirst({
			where: {
				userId,
				projectId
			},
			select: {
				role: true
			}
		})

		if (!member) {
			throw new ForbiddenException('Access denied to this project')
		}

		const hasRole = requiredRoles.includes(member.role as Role)

		if (!hasRole) {
			throw new ForbiddenException('Insufficient permissions')
		}

		return true
	}
}
