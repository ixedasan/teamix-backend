import { join } from 'path'
import type { ApolloDriverConfig } from '@nestjs/apollo'
import { ConfigService } from '@nestjs/config'
import { isDev } from '@/src/shared/utils/is-dev.util'

export function getGraphQLConfig(
	configService: ConfigService
): ApolloDriverConfig {
	return {
		playground: isDev(configService),
		path: configService.getOrThrow<string>('GRAPHQL_PREFIX'),
		autoSchemaFile: join(process.cwd(), 'src/core/graphql/schema.gql'),
		sortSchema: true,
		subscriptions: {
			'graphql-ws': true,
			'subscriptions-transport-ws': true
		},
		context: ({ req, res }) => ({ req, res })
	}
}
