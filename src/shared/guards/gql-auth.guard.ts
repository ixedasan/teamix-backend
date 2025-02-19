import {
	Injectable,
	UnauthorizedException,
	type CanActivate,
	type ExecutionContext
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GqlExecutionContext } from '@nestjs/graphql'
import { PrismaService } from '@/src/core/prisma/prisma.service'

@Injectable()
export class GqlAuthGuard implements CanActivate {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = GqlExecutionContext.create(context)
		const request = ctx.getContext().req
		const response = ctx.getContext().res

		if (typeof request.session.userId === 'undefined') {
			this.logoutUser(request, response)
			throw new UnauthorizedException('User not authenticated')
		}

		const user = await this.prismaService.user.findUnique({
			where: { id: request.session.userId }
		})

		if (!user) {
			this.logoutUser(request, response)
			throw new UnauthorizedException('User not authenticated')
		}

		request.user = user
		return true
	}

	private logoutUser(request, response) {
		request.session.destroy(err => {
			if (err) {
				console.error('Session destruction error:', err)
			}
		})

		response.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'))
	}
}
