import { Injectable, NotFoundException } from '@nestjs/common'
import * as Upload from 'graphql-upload/Upload.js'
import { v4 as uuidv4 } from 'uuid'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { StorageService } from '../../libs/storage/storage.service'

@Injectable()
export class AttachmentService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly storageService: StorageService
	) {}

	public async getAttachments(taskId: string) {
		const attachments = await this.prismaService.attachment.findMany({
			where: {
				taskId
			}
		})

		if (!attachments) {
			throw new NotFoundException('Attachments not found')
		}

		return attachments
	}

	public async uloadAttachment(taskId: string, file: Upload) {
		const chunks: Buffer[] = []

		for await (const chunk of file.createReadStream()) {
			chunks.push(chunk)
		}

		const buffer = Buffer.concat(chunks)

		const fileExtension = file.filename.split('.').pop()
		const uniqueFilename = `${Date.now()}-${uuidv4}.${fileExtension}`
		const filePath = `tasks/${taskId}/attachments/${uniqueFilename}`

		try {
			await this.storageService.upload(buffer, filePath, file.mimetype)

			await this.prismaService.attachment.create({
				data: {
					filename: file.filename,
					filepath: filePath,
					mimeType: file.mimetype,
					size: buffer.length,
					taskId
				}
			})

			return true
		} catch (error) {
			throw new Error(`Failed to upload attachment: ${error}`)
		}
	}

	public async deleteAttachment(attachmentId: string) {
		const attachment = await this.prismaService.attachment.findUnique({
			where: {
				id: attachmentId
			}
		})

		if (!attachment) {
			throw new NotFoundException('Attachment not found')
		}

		try {
			await this.storageService.delete(attachment.filepath)

			await this.prismaService.attachment.delete({
				where: {
					id: attachmentId
				}
			})

			return true
		} catch (error) {
			throw new Error(`Failed to delete attachment: ${error}`)
		}
	}

	public async generateDownloadUrl(attachmentId: string) {
		const attachment = await this.prismaService.attachment.findUnique({
			where: {
				id: attachmentId
			}
		})

		if (!attachment) {
			throw new NotFoundException('Attachment not found')
		}

		const downloadUrl = await this.storageService.getSignedUrl(
			attachment.filepath
		)

		return downloadUrl
	}
}
