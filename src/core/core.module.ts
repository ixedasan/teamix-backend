import { ApolloDriver } from '@nestjs/apollo'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { AnalyticsModule } from '../modules/analytics/analytics.module'
import { AccountModule } from '../modules/auth/account/account.module'
import { PasswordRecoveryModule } from '../modules/auth/password-recovery/password-recovery.module'
import { ProfileModule } from '../modules/auth/profile/profile.module'
import { SessionModule } from '../modules/auth/session/session.module'
import { TotpModule } from '../modules/auth/totp/totp.module'
import { VerificationModule } from '../modules/auth/verification/verification.module'
import { CronModule } from '../modules/cron/cron.module'
import { DocumentModule } from '../modules/document/document.module'
import { MailModule } from '../modules/libs/mail/mail.module'
import { PubSubModule } from '../modules/libs/pubsub/pubsub.module'
import { StorageModule } from '../modules/libs/storage/storage.module'
import { StripeModule } from '../modules/libs/stripe/stripe.module'
import { TelegramModule } from '../modules/libs/telegram/telegram.module'
import { NotificationModule } from '../modules/notification/notification.module'
import { MemberModule } from '../modules/project/member/member.module'
import { ProjectCoreModule } from '../modules/project/project-core/project-core.module'
import { ProjectPlanModule } from '../modules/project/project-plan/project-plan.module'
import { AttachmentModule } from '../modules/task/attachment/attachment.module'
import { CommentModule } from '../modules/task/comment/comment.module'
import { TaskAssigneeModule } from '../modules/task/task-assignee/task-assignee.module'
import { TaskLabelsModule } from '../modules/task/task-labels/task-labels.module'
import { TaskLinkModule } from '../modules/task/task-link/task-link.module'
import { TaskModule } from '../modules/task/task/task.module'
import { WebhookModule } from '../modules/webhook/webhook.module'
import { ProjectMiddleware } from '../shared/middlewares/project.middleware'
import { CacheModule } from './cache/cache.module'
import { getGraphQLConfig } from './config/graphql.config'
import { getStripeConfig } from './config/stripe.config'
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
		StripeModule.registerAsync({
			imports: [ConfigModule],
			useFactory: getStripeConfig,
			inject: [ConfigService]
		}),
		PrismaModule,
		RedisModule,
		CacheModule,
		MailModule,
		StorageModule,
		PubSubModule,
		AccountModule,
		SessionModule,
		ProfileModule,
		VerificationModule,
		PasswordRecoveryModule,
		TotpModule,
		TelegramModule,
		StripeModule,
		WebhookModule,
		NotificationModule,
		CronModule,
		ProjectCoreModule,
		ProjectPlanModule,
		AnalyticsModule,
		MemberModule,
		TaskModule,
		TaskAssigneeModule,
		TaskLabelsModule,
		AttachmentModule,
		TaskLinkModule,
		CommentModule,
		DocumentModule,
		CacheModule
	]
})
export class CoreModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(ProjectMiddleware).forRoutes('*')
	}
}
