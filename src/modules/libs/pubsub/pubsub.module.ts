import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RedisPubSub } from 'graphql-redis-subscriptions'

export const PUB_SUB = 'PUB_SUB'

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: PUB_SUB,
			inject: [ConfigService],
			useFactory: (configService: ConfigService) =>
				new RedisPubSub({
					connection: {
						username: configService.get<string>('REDIS_USER'),
						password: configService.get<string>('REDIS_PASSWORD'),
						host: configService.getOrThrow<string>('REDIS_HOST'),
						port: configService.get<number>('REDIS_PORT')
					}
				})
		}
	],
	exports: [PUB_SUB]
})
export class PubSubModule {}
