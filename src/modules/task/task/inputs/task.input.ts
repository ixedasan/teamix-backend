import { Field, ID, InputType, registerEnumType } from '@nestjs/graphql'
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength
} from 'class-validator'
import { Priority, TaskStatus } from '@/prisma/generated'

registerEnumType(TaskStatus, {
	name: 'TaskStatus'
})

registerEnumType(Priority, {
	name: 'Priority'
})

@InputType()
export class TaskInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	title: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	public description?: string

	@Field(() => TaskStatus)
	@IsEnum(TaskStatus)
	@IsNotEmpty()
	public status: TaskStatus

	@Field(() => Priority)
	@IsEnum(Priority)
	@IsNotEmpty()
	public priority: Priority

	@Field(() => [ID], { nullable: true })
	@IsUUID('4', { each: true })
	@IsOptional()
	public labelsIds?: string[]

	@Field(() => ID, { nullable: true })
	@IsUUID('4')
	@IsOptional()
	public assigneeId?: string

	@Field(() => Date, { nullable: true })
	@IsOptional()
	public startDate?: Date

	@Field(() => Date, { nullable: true })
	@IsOptional()
	public dueDate?: Date
}
