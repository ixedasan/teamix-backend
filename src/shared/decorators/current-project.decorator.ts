import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

export const CurrentProject = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		let projectId: string

		if (ctx.getType() === 'http') {
			projectId = ctx.switchToHttp().getRequest().session.projectId
		} else {
			const context = GqlExecutionContext.create(ctx)
			projectId = context.getContext().req.session.projectId
		}

		if (!projectId) {
			throw new Error('Project ID not set in session')
		}

		return projectId
	}
)
