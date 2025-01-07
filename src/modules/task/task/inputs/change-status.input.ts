import { Field, ID, InputType, registerEnumType } from '@nestjs/graphql'
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator'
import { TaskStatus } from '@/prisma/generated'

registerEnumType(TaskStatus, {
	name: 'TaskStatus'
})

@InputType()
export class ChangeStatusInput {
	@Field(() => ID)
	@IsUUID('4')
	@IsNotEmpty()
	public taskId: string

	@Field(() => TaskStatus, { nullable: true })
	@IsEnum(TaskStatus)
	public status: TaskStatus
}
