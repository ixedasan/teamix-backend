import { createKeyv } from '@keyv/redis'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Cacheable } from 'cacheable'

@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: 'CACHE_INSTANCE',
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const redisUrl = configService.getOrThrow<string>('REDIS_URI')
				const secondary = createKeyv(redisUrl)
				return new Cacheable({ secondary, ttl: '30m' })
			}
		}
	],
	exports: ['CACHE_INSTANCE']
})
export class CacheModule {}
