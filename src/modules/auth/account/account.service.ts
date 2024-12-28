import { ConflictException, Injectable } from '@nestjs/common'
import { hash } from 'argon2'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { CreateUserInput } from './inpunts/create-user.input'

@Injectable()
export class AccountService {
	public constructor(private readonly prismaService: PrismaService) {}

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

		await this.prismaService.user.create({
			data: {
				username,
				email,
				password: await hash(password),
				displayName: username
			}
		})

		return true
	}
}
