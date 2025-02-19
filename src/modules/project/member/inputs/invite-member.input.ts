import { Field, InputType } from '@nestjs/graphql'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { Role } from '@/prisma/generated'

@InputType()
export class InviteMemberInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	public email: string

	@Field(() => Role)
	@IsString()
	@IsNotEmpty()
	public role: Role
}
