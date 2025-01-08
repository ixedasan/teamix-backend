import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js'
import * as Upload from 'graphql-upload/Upload.js'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { AttachmentValidationPipe } from '@/src/shared/pipes/attachment-validation.pipe'
import { AttachmentService } from './attachment.service'
import { AttachmentModel } from './models/attachment.model'

@Resolver('Attachment')
export class AttachmentResolver {
	public constructor(private readonly attachmentService: AttachmentService) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => [AttachmentModel], { name: 'findTaskAttachments' })
	public async getAttachments(@Args() taskId: string) {
		return this.attachmentService.getAttachments(taskId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => Boolean, { name: 'uploadTaskAttachment' })
	public async uploadAttachment(
		@Args() taskId: string,
		@Args('file', { type: () => GraphQLUpload }, AttachmentValidationPipe)
		file: Upload
	) {
		return this.attachmentService.uloadAttachment(taskId, file)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => Boolean, { name: 'deleteTaskAttachment' })
	public async deleteAttachment(@Args() attachmentId: string) {
		return this.attachmentService.deleteAttachment(attachmentId)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Mutation(() => String, { name: 'generateAttachmentDownloadUrl' })
	public async generateDownloadLink(@Args() attachmentId: string) {
		return this.attachmentService.generateDownloadUrl(attachmentId)
	}
}
