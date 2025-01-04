import { Injectable, NotFoundException } from '@nestjs/common'
import type { Request } from 'express'
import * as Upload from 'graphql-upload/Upload.js'
import sharp from 'sharp'
import { Role, type User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { StorageService } from '../../libs/storage/storage.service'
import { ProjectInput } from './input/project.input'

@Injectable()
export class ProjectCoreService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly storageService: StorageService
	) {}

	public async gerUserProjects(user: User) {
		const projects = await this.prismaService.project.findMany({
			where: {
				members: {
					some: {
						userId: user.id
					}
				}
			},
			include: {
				members: true
			}
		})

		return projects
	}

	async setCurrentProject(req: Request, projectId: string) {
		if (!req.session.userId) {
			throw new NotFoundException('User not authenticated')
		}

		const project = await this.prismaService.project.findFirst({
			where: {
				id: projectId,
				members: {
					some: {
						userId: req.session.userId
					}
				}
			}
		})

		if (!project) {
			throw new NotFoundException('Project not found or access denied')
		}

		req.session.projectId = project.id

		return true
	}

	public async createProject(user: User, input: ProjectInput) {
		await this.prismaService.project.create({
			data: {
				...input,
				members: {
					create: {
						role: Role.ADMIN,
						user: {
							connect: {
								id: user.id
							}
						}
					}
				}
			},
			include: {
				members: true
			}
		})

		return true
	}

	public async updateProject(user: User, id: string, input: ProjectInput) {
		const project = await this.prismaService.project.findUnique({
			where: {
				id
			}
		})

		if (!project) {
			throw new NotFoundException('Project not found')
		}

		await this.prismaService.project.update({
			where: {
				id
			},
			data: {
				...input
			}
		})

		return true
	}

	public async deleteProject(id: string) {
		await this.prismaService.project.delete({
			where: {
				id
			}
		})

		return true
	}

	public async changeCover(id: string, file: Upload) {
		const project = await this.prismaService.project.findUnique({
			where: {
				id
			}
		})

		if (!project) {
			throw new NotFoundException('Project not found')
		}

		if (project.cover) {
			await this.storageService.delete(project.cover)
		}

		const chunks: Buffer[] = []

		for await (const chunk of file.createReadStream()) {
			chunks.push(chunk)
		}

		const buffer = Buffer.concat(chunks)

		const fileName = `projects/${project.id}/cover.webp`

		if (file.filename && file.filename.endsWith('.gif')) {
			const processedBuffer = await sharp(buffer, { animated: true })
				.webp()
				.toBuffer()

			await this.storageService.upload(processedBuffer, fileName, 'image/webp')
		} else {
			const processedBuffer = await sharp(buffer).webp().toBuffer()

			await this.storageService.upload(processedBuffer, fileName, 'image/webp')
		}

		await this.prismaService.project.update({
			where: {
				id
			},
			data: {
				cover: fileName
			}
		})

		return true
	}

	public async removeCover(id: string) {
		const project = await this.prismaService.project.findUnique({
			where: {
				id
			}
		})

		if (!project) {
			throw new NotFoundException('Project not found')
		}

		if (!project.cover) {
			return
		}

		await this.storageService.delete(project.cover)

		await this.prismaService.project.update({
			where: {
				id
			},
			data: {
				cover: null
			}
		})

		return true
	}
}
