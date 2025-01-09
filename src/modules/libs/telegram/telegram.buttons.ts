import { Markup } from 'telegraf'
import type { InlineKeyboardMarkup } from 'telegraf/types'

export const BUTTONS: {
	authSuccess: Markup.Markup<InlineKeyboardMarkup>
	profile: Markup.Markup<InlineKeyboardMarkup>
} = {
	authSuccess: Markup.inlineKeyboard([
		[
			Markup.button.callback('📜 Tasks Assigned', 'tasks'),
			Markup.button.callback('👤 View Profile', 'me')
		],
		[
			Markup.button.url('🌐 To site', 'https://example.com') // TODO: Replace with a valid URL
		]
	]),
	profile: Markup.inlineKeyboard([
		Markup.button.url('⚙️ Account settings', 'https://example.com/settings') // TODO: Replace with a valid URL
	])
}
