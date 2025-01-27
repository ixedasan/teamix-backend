import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import { ProjectPlan, TransactionStatus } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { StripeService } from '../libs/stripe/stripe.service'

@Injectable()
export class WebhookService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly stripeService: StripeService
	) {}

	public async receiveWebhookStripe(event: Stripe.Event) {
		const session = event.data.object as Stripe.Checkout.Session

		if (event.type === 'checkout.session.completed') {
			const projectId = session.metadata.projectId

			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + 30)

			await this.prismaService.projectSubscription.updateMany({
				where: {
					stripeSubscriptionId: session.id
				},
				data: {
					status: TransactionStatus.SUCCESS,
					expiresAt
				}
			})

			await this.prismaService.project.update({
				where: {
					id: projectId
				},
				data: {
					plan: ProjectPlan.PRO
				}
			})
		}
		if (event.type === 'checkout.session.expired') {
			await this.prismaService.projectSubscription.updateMany({
				where: {
					stripeSubscriptionId: session.id
				},
				data: {
					status: TransactionStatus.EXPIRED
				}
			})
		}
		if (event.type === 'checkout.session.async_payment_failed') {
			await this.prismaService.projectSubscription.updateMany({
				where: {
					stripeSubscriptionId: session.id
				},
				data: {
					status: TransactionStatus.FAILED
				}
			})
		}
	}

	public constructStripeEvent(payload: any, signature: any) {
		return this.stripeService.webhooks.constructEvent(
			payload,
			signature,
			this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET')
		)
	}
}
