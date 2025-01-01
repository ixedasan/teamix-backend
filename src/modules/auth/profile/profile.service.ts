import { ConflictException, Injectable } from '@nestjs/common'
import * as Upload from 'graphql-upload/Upload.js'
import * as sharp from 'sharp'
import type { User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { StorageService } from '../../libs/storage/storage.service'
import { ChangeProfileInfoInput } from './inputs/change-info.input'

@Injectable()
export class ProfileService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly storageService: StorageService
	) {}

	public async changeAvatar(user: User, file: Upload) {
		if (user.avatar) {
			await this.storageService.delete(user.avatar)
		}

		const chunks: Buffer[] = []

		for await (const chunk of file.createReadStream()) {
			chunks.push(chunk)
		}

		const buffer = Buffer.concat(chunks)

		const fileName = `avatars/${user.id}/${file.filename}.webp`

		if (file.filename && file.filename.endsWith('.gif')) {
			const processedBuffer = await sharp(buffer, { animated: true })
				.resize(512, 521)
				.webp()
				.toBuffer()

			await this.storageService.upload(processedBuffer, fileName, 'image/webp')
		} else {
			const processedBuffer = await sharp(buffer)
				.resize(512, 512)
				.webp()
				.toBuffer()

			await this.storageService.upload(processedBuffer, fileName, 'image/webp')
		}
		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				avatar: fileName
			}
		})

		return true
	}

	public async removeAvatar(user: User) {
		if (!user.avatar) {
			return
		}

		await this.storageService.delete(user.avatar)

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				avatar: null
			}
		})

		return true
	}

	public async changeInfo(user: User, input: ChangeProfileInfoInput) {
		const { username, displayName, bio } = input

		const usenameExists = await this.prismaService.user.findUnique({
			where: {
				username
			}
		})

		if (usenameExists && username !== user.username) {
			throw new ConflictException('Username already exists')
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				username,
				displayName,
				bio
			}
		})

		return true
	}
}
