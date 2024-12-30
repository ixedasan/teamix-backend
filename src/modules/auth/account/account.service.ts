import {
	BadRequestException,
	ConflictException,
	Injectable
} from '@nestjs/common'
import { hash, verify } from 'argon2'
import type { User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { VerificationService } from '../verification/verification.service'
import { ChangeEmailInput } from './inpunts/change-email.input'
import { ChangePasswordInput } from './inpunts/change-password.input'
import { CreateUserInput } from './inpunts/create-user.input'

@Injectable()
export class AccountService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly verificationService: VerificationService
	) {}

	public async me(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				id
			}
		})

		return user
	}

	public async create(input: CreateUserInput) {
		const { username, email, password } = input

		const isUserExist = await this.prismaService.user.findUnique({
			where: {
				username
			}
		})

		if (isUserExist) {
			throw new ConflictException('This username already exists')
		}

		const isEmailExist = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})

		if (isEmailExist) {
			throw new ConflictException('This email already exists')
		}

		const user = await this.prismaService.user.create({
			data: {
				username,
				email,
				password: await hash(password),
				displayName: username
			}
		})

		await this.verificationService.sendVerificationToken(user)

		return true
	}

	public async changeEmail(user: User, input: ChangeEmailInput) {
		const { email } = input

		const isEmailExist = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})

		if (isEmailExist) {
			throw new ConflictException('This email already exists')
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				email
			}
		})

		return true
	}

	public async changePassword(user: User, input: ChangePasswordInput) {
		const { oldPassword, newPassword } = input

		const isPasswordCorrect = await verify(user.password, oldPassword)

		if (!isPasswordCorrect) {
			throw new BadRequestException('This password is incorrect')
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				password: await hash(newPassword)
			}
		})

		return true
	}
}
