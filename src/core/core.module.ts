import { ApolloDriver } from '@nestjs/apollo'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { AccountModule } from '../modules/auth/account/account.module'
import { PasswordRecoveryModule } from '../modules/auth/password-recovery/password-recovery.module'
import { ProfileModule } from '../modules/auth/profile/profile.module'
import { SessionModule } from '../modules/auth/session/session.module'
import { TotpModule } from '../modules/auth/totp/totp.module'
import { VerificationModule } from '../modules/auth/verification/verification.module'
import { DocumentModule } from '../modules/document/document.module'
import { MailModule } from '../modules/libs/mail/mail.module'
import { StorageModule } from '../modules/libs/storage/storage.module'
import { MemberModule } from '../modules/project/member/member.module'
import { ProjectCoreModule } from '../modules/project/project-core/project-core.module'
import { AttachmentModule } from '../modules/task/attachment/attachment.module'
import { CommentModule } from '../modules/task/comment/comment.module'
import { TaskAssigneeModule } from '../modules/task/task-assignee/task-assignee.module'
import { TaskLabelsModule } from '../modules/task/task-labels/task-labels.module'
import { TaskModule } from '../modules/task/task/task.module'
import { ProjectMiddleware } from '../shared/middlewares/project.middleware'
import { getGraphQLConfig } from './config/graphql.config'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			ignoreEnvFile: true,
			isGlobal: true
		}),
		GraphQLModule.forRootAsync({
			driver: ApolloDriver,
			imports: [ConfigModule],
			useFactory: getGraphQLConfig,
			inject: [ConfigService]
		}),
		PrismaModule,
		RedisModule,
		MailModule,
		StorageModule,
		AccountModule,
		SessionModule,
		ProfileModule,
		VerificationModule,
		PasswordRecoveryModule,
		TotpModule,
		ProjectCoreModule,
		MemberModule,
		TaskModule,
		TaskAssigneeModule,
		TaskLabelsModule,
		AttachmentModule,
		CommentModule,
		DocumentModule
	]
})
export class CoreModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(ProjectMiddleware).forRoutes('*')
	}
}
