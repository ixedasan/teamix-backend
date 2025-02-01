import { InputType, PartialType } from '@nestjs/graphql'
import { TaskInput } from './task.input'

@InputType()
export class UpdateTaskInput extends PartialType(TaskInput) {}
