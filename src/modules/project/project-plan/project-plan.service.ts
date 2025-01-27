import { ConflictException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type Project, type User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { StripeService } from '../../libs/stripe/stripe.service'

@Injectable()
export class ProjectPlanService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly stripeService: StripeService
	) {}

	public async makePayment(user: User, project: Project) {
		const existPlan = await this.prismaService.projectSubscription.findFirst({
			where: {
				AND: {
					projectId: project.id,
					expiresAt: {
						gte: new Date()
					}
				}
			}
		})

		if (existPlan) {
			throw new ConflictException('Project already has a plan')
		}

		const customer = await this.stripeService.customers.create({
			email: user.email,
			name: user.username
		})

		const successUrl = `${this.configService.getOrThrow<string>('ALLOWED_ORIGIN')}/success?project=${project.id}`
		const cancelUrl = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')

		const session = await this.stripeService.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: 'usd',
						product_data: {
							name: 'PRO'
						},
						unit_amount: 1000,
						recurring: {
							interval: 'month'
						}
					},
					quantity: 1
				}
			],
			mode: 'subscription',
			success_url: successUrl,
			cancel_url: cancelUrl,
			customer: customer.id,
			metadata: {
				projectId: project.id,
				userId: user.id
			}
		})

		await this.prismaService.projectSubscription.create({
			data: {
				projectId: project.id,
				stripeSubscriptionId: session.id,
				stripeCustomerId: customer.id
			}
		})

		return { url: session.url }
	}
}
