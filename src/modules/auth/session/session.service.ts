import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import type { Request } from 'express'
import { TOTP } from 'otpauth'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { RedisService } from '@/src/core/redis/redis.service'
import { getSessionMetadata } from '@/src/shared/utils/session-metadata.util'
import { destroySession, saveSession } from '@/src/shared/utils/session.util'
import { VerificationService } from '../verification/verification.service'
import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
	public constructor(
		private readonly prismaServiece: PrismaService,
		private readonly redisService: RedisService,
		private readonly configService: ConfigService,
		private readonly verificationService: VerificationService
	) {}

	public async findByUser(req: Request) {
		const userId = req.session.userId

		if (!userId) {
			throw new NotFoundException('Пользователь не обнаружен в сессии')
		}

		const keys = await this.redisService.keys('*')

		const userSessions = []

		for (const key of keys) {
			const sessionData = await this.redisService.get(key)

			if (sessionData) {
				const session = JSON.parse(sessionData)

				if (session.userId === userId) {
					userSessions.push({
						...session,
						id: key.split(':')[1]
					})
				}
			}
		}

		userSessions.sort((a, b) => b.createdAt - a.createdAt)

		return userSessions.filter(session => session.id !== req.session.id)
	}

	public async findCurrent(req: Request) {
		const sessionId = req.session.id

		const sessionData = await this.redisService.get(
			`${this.configService.getOrThrow<string>('SESSION_FOLDER')}${sessionId}`
		)

		const session = JSON.parse(sessionData)

		return {
			...session,
			id: sessionId
		}
	}

	public async login(req: Request, input: LoginInput, userAgent: string) {
		const { login, password, pin } = input

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

		if (!user.isEmailVerified) {
			await this.verificationService.sendVerificationToken(user)

			throw new BadRequestException(
				'Email is not verified, please check your email'
			)
		}

		if (user.isTotpEnabled) {
			if (!pin) {
				return {
					message: 'Please provide pin'
				}
			}

			const totp = new TOTP({
				issuer: 'teamix',
				label: `${user.email}`,
				algorithm: 'SHA1',
				digits: 6,
				secret: user.totpSecret
			})

			const delta = totp.validate({ token: pin })

			if (delta === null) {
				throw new BadRequestException('Invalid pin')
			}
		}

		const metadata = getSessionMetadata(req, userAgent)

		return saveSession(req, user, metadata)
	}

	public async logout(req: Request) {
		return destroySession(req, this.configService)
	}

	public async clearSession(req: Request) {
		req.res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'))

		return true
	}

	public async removeSession(req: Request, id: string) {
		if (req.session.id === id) {
			throw new UnauthorizedException('You can not remove your current session')
		}

		await this.redisService.del(
			`${this.configService.getOrThrow<string>('SESSION_FOLDER')}${id}`
		)

		return true
	}
}
