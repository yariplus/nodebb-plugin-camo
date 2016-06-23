import 'app-module-path/register'
import { init as initControllers } from 'controllers'
import { init as initSettings } from 'settings'

export function init (params, callback) {
	const {router, middleware} = params

	initControllers(router, middleware)
	initSettings(callback)
}

export { addAdminNavigation } from 'settings'
export { reload } from 'server'
export { parseRaw, parsePost, parseSignature } from 'parser'
