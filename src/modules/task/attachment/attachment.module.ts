import { Module } from '@nestjs/common'
import { AttachmentResolver } from './attachment.resolver'
import { AttachmentService } from './attachment.service'

@Module({
	providers: [AttachmentResolver, AttachmentService]
})
export class AttachmentModule {}
