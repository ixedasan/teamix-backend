import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { ChangeDocumentInput } from './inputs/change-document.input'
import { CreateDocumentInput } from './inputs/create-document.input'

@Injectable()
export class DocumentService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async getDocuments(projectId: string) {
		const documents = await this.prismaService.document.findMany({
			where: { projectId }
		})

		return documents
	}

	public async getDocument(documentId: string) {
		const document = await this.prismaService.document.findUnique({
			where: { id: documentId }
		})

		if (!document) {
			throw new NotFoundException('Document not found')
		}

		return document
	}

	public async createDocument(projectId: string, input: CreateDocumentInput) {
		const { title } = input

		await this.prismaService.document.create({
			data: {
				title,
				project: {
					connect: { id: projectId }
				}
			}
		})

		return true
	}

	public async updateDocument(documentId: string, input: ChangeDocumentInput) {
		const document = await this.prismaService.document.findUnique({
			where: { id: documentId }
		})

		if (!document) {
			throw new NotFoundException('Document not found')
		}

		const updatedDocument = await this.prismaService.document.update({
			where: { id: documentId },
			data: input
		})

		return updatedDocument
	}

	public async deleteDocument(documentId: string) {
		const document = await this.prismaService.document.findUnique({
			where: { id: documentId }
		})

		if (!document) {
			throw new NotFoundException('Document not found')
		}

		await this.prismaService.document.delete({
			where: { id: documentId }
		})

		return true
	}
}
