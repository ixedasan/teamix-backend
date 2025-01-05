import {
	BadRequestException,
	createParamDecorator,
	type ExecutionContext
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import type { Project } from '@/prisma/generated'

export const CurrentProject = createParamDecorator(
	(data: keyof Project, ctx: ExecutionContext) => {
		let project: string

		if (ctx.getType() === 'http') {
			project = ctx.switchToHttp().getRequest().project
		} else {
			const context = GqlExecutionContext.create(ctx)
			project = context.getContext().req.project
		}

		if (!project) {
			throw new BadRequestException('Project ID not set in session')
		}

		return data ? project[data] : project
	}
)
