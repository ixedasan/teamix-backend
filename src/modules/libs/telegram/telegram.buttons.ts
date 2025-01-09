import { Markup } from 'telegraf'
import type { InlineKeyboardMarkup } from 'telegraf/types'

export const BUTTONS: {
	authSuccess: Markup.Markup<InlineKeyboardMarkup>
	profile: Markup.Markup<InlineKeyboardMarkup>
	taskControls: Markup.Markup<InlineKeyboardMarkup>
} = {
	authSuccess: Markup.inlineKeyboard([
		[
			Markup.button.callback('📜 My Tasks', 'tasks'),
			Markup.button.callback('👤 Profile', 'me')
		],
		[Markup.button.callback('⚙️ Settings', 'settings')],
		[Markup.button.url('🌐 Open TEAMIX', 'https://teamix.example.app')]
	]),

	profile: Markup.inlineKeyboard([
		[Markup.button.callback('📜 View Tasks', 'tasks')],
		[
			Markup.button.url('⚙️ Settings', `https://teamix.example.app/settings`),
			Markup.button.url('📝 Edit Profile', `https://teamix.example.app/profile`)
		]
	]),

	taskControls: Markup.inlineKeyboard([
		[
			Markup.button.callback('📋 All Tasks', 'tasks'),
			Markup.button.callback('⏰ Overdue', 'tasks_overdue')
		],
		[
			Markup.button.callback('🔄 In Progress', 'tasks_in_progress'),
			Markup.button.callback('✅ Completed', 'tasks_completed')
		],
		[Markup.button.url('📱 Open App', 'https://teamix.example.app')],
		[Markup.button.callback('🔙 Back to Profile', 'me')]
	])
}
