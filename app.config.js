// app.config.js
export default ({ config }) => ({
	...config,
	android: {
		...config.android,
		jsEngine: 'jsc',
	},
	ios: {
		...config.ios,
		jsEngine: 'jsc',
	},
	extra: {
		apiHost: process.env.EXPO_PUBLIC_API_HOST || 'http://localhost:7247',
	},
});