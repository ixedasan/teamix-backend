import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString } from 'class-validator'
import { Role } from '@/prisma/generated'

@InputType()
export class ChangeRoleInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public projectId: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public userId: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public role: Role
}
