import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import type { Request } from 'express'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
	public constructor(
		private readonly prismaServiece: PrismaService,
		private readonly configService: ConfigService
	) {}

	public async login(req: Request, input: LoginInput) {
		const { login, password } = input

		const user = await this.prismaServiece.user.findFirst({
			where: {
				OR: [{ email: { equals: login } }, { username: { equals: login } }]
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		const isPasswordValid = await verify(user.password, password)

		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid password')
		}

		return new Promise((resolve, regect) => {
			req.session.createdAt = new Date()
			req.session.userId = user.id

			req.session.save(err => {
				if (err) {
					return regect(
						new InternalServerErrorException('Failed to save session')
					)
				} else {
					resolve(user)
				}
			})
		})
	}

	public async logout(req: Request) {
		return new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err) {
					reject(new InternalServerErrorException('Failed to destroy session'))
				} else {
					req.res.clearCookie(
						this.configService.getOrThrow<string>('SESSION_NAME')
					)
					resolve(true)
				}
			})
		})
	}
}
