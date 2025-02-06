import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { CommentModel } from './comment.model'

export enum MutationType {
	CREATED = 'CREATED',
	UPDATED = 'UPDATED',
	DELETED = 'DELETED'
}

registerEnumType(MutationType, { name: 'MutationType' })

@ObjectType()
export class CommentSubscriptionPayload {
	@Field(() => MutationType)
	mutation: MutationType

	@Field(() => CommentModel, { nullable: true })
	comment?: CommentModel
}
