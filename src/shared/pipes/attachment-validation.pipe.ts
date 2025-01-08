import { ReadStream } from 'fs'
import {
	BadRequestException,
	Injectable,
	type ArgumentMetadata,
	type PipeTransform
} from '@nestjs/common'
import { validateFileSize } from '../utils/file.util'

@Injectable()
export class AttachmentValidationPipe implements PipeTransform {
	public async transform(value: any, metadata: ArgumentMetadata) {
		if (!value.filename) {
			throw new BadRequestException('File not uploaded')
		}

		const { createReadStream } = value

		const fileStream = createReadStream() as ReadStream

		const isFileSizeValid = await validateFileSize(
			fileStream,
			500 * 1024 * 1024
		)

		if (!isFileSizeValid) {
			throw new BadRequestException('File size is too large')
		}

		return value
	}
}
