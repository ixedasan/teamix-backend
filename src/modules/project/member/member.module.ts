import { Module } from '@nestjs/common'
import { NotificationService } from '../../notification/notification.service'
import { MemberResolver } from './member.resolver'
import { MemberService } from './member.service'

@Module({
	providers: [MemberResolver, MemberService, NotificationService]
})
export class MemberModule {}
