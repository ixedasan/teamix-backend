import { Module } from '@nestjs/common'
import { CacheModule } from '@/src/core/cache/cache.module'
import { CacheService } from '@/src/core/cache/cache.service'
import { AnalyticsResolver } from './analytics.resolver'
import { AnalyticsService } from './analytics.service'

@Module({
	imports: [CacheModule],
	providers: [AnalyticsResolver, AnalyticsService, CacheService]
})
export class AnalyticsModule {}
