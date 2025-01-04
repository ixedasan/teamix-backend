import {
	CanActivate,
	ExecutionContext,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { PrismaService } from '@/src/core/prisma/prisma.service'

@Injectable()
export class ProjectGuard implements CanActivate {
	constructor(private readonly prismaService: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = GqlExecutionContext.create(context)
		const request = ctx.getContext().req

		const projectId = request.session.projectId
		const userId = request.session.userId

		if (!projectId) {
			throw new UnauthorizedException('Project ID is not set in session')
		}

		const project = await this.prismaService.project.findFirst({
			where: {
				id: projectId,
				members: {
					some: {
						userId
					}
				}
			}
		})

		if (!project) {
			throw new NotFoundException('Project not found or access denied')
		}

		return true
	}
}
