import Constants from 'expo-constants';

export const getHost = async () => {
	const apiHost =
		Constants.expoConfig?.extra?.apiHost || 'http://localhost:7247';
	console.log('API Host:', apiHost);
	return apiHost;
};
