import { randomBytes } from 'crypto'
import { BadRequestException, Injectable } from '@nestjs/common'
import { encode } from 'hi-base32'
import { TOTP } from 'otpauth'
import * as qrcode from 'qrcode'
import { User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { EnableTotpInput } from './inputs/enable-totp.input'

@Injectable()
export class TotpService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async generate(user: User) {
		const secret = encode(randomBytes(15)).replace(/=/g, '').substring(0, 24)

		const totp = new TOTP({
			issuer: 'teamix',
			label: `${user.email}`,
			algorithm: 'SHA1',
			digits: 6,
			secret
		})

		const otpauthUrl = totp.toString()
		const qrCodeUrl = await qrcode.toDataURL(otpauthUrl)

		return {
			qrCodeUrl,
			secret
		}
	}

	public async enable(user: User, input: EnableTotpInput) {
		const { secret, pin } = input

		const totp = new TOTP({
			issuer: 'teamix',
			label: `${user.email}`,
			algorithm: 'SHA1',
			digits: 6,
			secret
		})

		const delta = totp.validate({ token: pin })

		if (delta === null) {
			throw new BadRequestException('Invalid pin')
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				isTotpEnabled: true,
				totpSecret: secret
			}
		})

		return true
	}

	public async disable(user: User) {
		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				isTotpEnabled: false,
				totpSecret: null
			}
		})

		return true
	}
}
