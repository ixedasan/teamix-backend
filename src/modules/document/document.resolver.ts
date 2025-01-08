import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql'
import { PubSub } from 'graphql-subscriptions'
import { Role } from '@/prisma/generated'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { DocumentService } from './document.service'
import { ChangeDocumentInput } from './inputs/change-document.input'
import { CreateDocumentInput } from './inputs/create-document.input'
import { DocumentModel } from './models/document.model'

@Resolver('Document')
export class DocumentResolver {
	private readonly pubSub: PubSub

	public constructor(private readonly documentService: DocumentService) {
		this.pubSub = new PubSub()
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [DocumentModel], { name: 'findDocumentsByProject' })
	public async findDocuments(@CurrentProject('id') projectId: string) {
		return this.documentService.getDocuments(projectId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => DocumentModel, { name: 'findDocument' })
	public async findDocument(@Args('documentId') documentId: string) {
		return this.documentService.getDocument(documentId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'createDocument' })
	public async createDocument(
		@CurrentProject('id') projectId: string,
		@Args('data') input: CreateDocumentInput
	) {
		return this.documentService.createDocument(projectId, input)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => DocumentModel, { name: 'changeDocument' })
	public async updateDocument(
		@Args('documentId') documentId: string,
		@Args('input') input: ChangeDocumentInput
	) {
		const document = await this.documentService.updateDocument(
			documentId,
			input
		)

		this.pubSub.publish('DOCUMENT_CHANGED', { documentUpdated: document })

		return document
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN, Role.MEMBER)
	@Mutation(() => Boolean, { name: 'deleteDocument' })
	public async deleteDocument(@Args('documentId') documentId: string) {
		return this.documentService.deleteDocument(documentId)
	}

	@Subscription(() => DocumentModel, {
		filter: (payload, variables) =>
			payload.documentUpdated.documentId === variables.documentId
	})
	public documentUpdated(@Args('projectId') projectId: string) {
		return this.pubSub.asyncIterableIterator('DOCUMENT_CHANGED')
	}
}
