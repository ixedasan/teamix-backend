import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Cache } from 'cache-manager'
import { PrismaService } from '@/src/core/prisma/prisma.service'

@Injectable()
export class GqlAuthGuard implements CanActivate {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = GqlExecutionContext.create(context)
		const request = ctx.getContext().req
		const response = ctx.getContext().res

		if (!request.session?.userId) {
			this.logoutUser(request, response)
			throw new UnauthorizedException('User not authenticated')
		}

		const userId = request.session.userId

		let user = await this.cacheManager.get(`user:${userId}`)

		if (!user) {
			user = await this.prismaService.user.findUnique({
				where: { id: userId }
			})

			if (!user) {
				this.logoutUser(request, response)
				throw new UnauthorizedException('User not authenticated')
			}

			await this.cacheManager.set(`user:${userId}`, user, 600000) // 10 minutes
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
