import { Field, InputType } from '@nestjs/graphql'
import {
	IsNotEmpty,
	IsString,
	IsUUID,
	MinLength,
	Validate
} from 'class-validator'
import { IsPasswordMatchingConstraint } from '@/src/shared/decorators/is-password-mathing-constraint.input'

@InputType()
export class NewPasswordInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	public password: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@Validate(IsPasswordMatchingConstraint)
	public passwordConfirmation: string

	@Field(() => String)
	@IsUUID()
	@IsNotEmpty()
	public token: string
}
