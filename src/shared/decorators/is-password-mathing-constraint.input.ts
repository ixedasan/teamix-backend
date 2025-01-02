import {
	ValidatorConstraint,
	type ValidationArguments,
	type ValidatorConstraintInterface
} from 'class-validator'
import { NewPasswordInput } from '@/src/modules/auth/password-recovery/inputs/new-password.input'

@ValidatorConstraint({ name: 'isPasswordMatching', async: false })
export class IsPasswordMatchingConstraint
	implements ValidatorConstraintInterface
{
	public validate(
		passwordConfirmation: string,
		args: ValidationArguments
	): boolean {
		const object = args.object as NewPasswordInput

		return passwordConfirmation === object.password
	}

	public defaultMessage(ValidationArguments?: ValidationArguments): string {
		return 'Passwords do not match'
	}
}
