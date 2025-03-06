import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { ProjectPlan } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'

@Injectable()
export class ProjectPlanGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly prismaService: PrismaService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const allowedPlans = this.reflector.getAllAndOverride<ProjectPlan[]>(
			'plans',
			[context.getHandler(), context.getClass()]
		)

		if (!allowedPlans || allowedPlans.length === 0) {
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

		const projectId = request.session.projectId

		const project = await this.prismaService.project.findUnique({
			where: { id: projectId },
			select: { plan: true }
		})

		if (!project) {
			throw new ForbiddenException('Project not found')
		}

		if (!allowedPlans.includes(project.plan as ProjectPlan)) {
			throw new ForbiddenException('Access restricted for this project plan')
		}

		return true
	}
}
