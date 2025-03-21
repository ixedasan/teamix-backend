import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { UserAgent } from '@/src/shared/decorators/user-agent.decorator'
import type { GqlContext } from '@/src/shared/types/gql-context.types'
import { AuthModel } from '../account/models/auth.model'
import { VerificationInput } from './inpunts/verification.input'
import { VerificationService } from './verification.service'

@Resolver('Verification')
export class VerificationResolver {
	public constructor(
		private readonly verificationService: VerificationService
	) {}

	@Mutation(() => AuthModel, { name: 'verifyAccaunt' })
	public async verify(
		@Context() { req }: GqlContext,
		@Args('data') input: VerificationInput,
		@UserAgent() userAgent: string
	) {
		return this.verificationService.verify(req, input, userAgent)
	}
}
