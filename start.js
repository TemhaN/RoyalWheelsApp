import { execSync } from 'child_process';
import os from 'os';

function getLocalIP() {
	const interfaces = os.networkInterfaces();
	const validIPs = [];
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			if (iface.family === 'IPv4' && !iface.internal) {
				validIPs.push({ name, address: iface.address });
			}
		}
	}
	console.log('Доступные IP-адреса:', validIPs);

	const targetIP = validIPs.find(ip => ip.address === '10.27.117.86');
	if (targetIP) {
		return targetIP.address.trim();
	}
	throw new Error('Не удалось найти IP 10.27.117.86');
}

try {
	const localIP = getLocalIP();
	const apiHost = `http://${localIP}:7247`;
	console.log(`Запускаем Expo с API_HOST: ${apiHost}...`);

	const command =
		process.platform === 'win32'
			? `set "EXPO_PUBLIC_API_HOST=${apiHost}" && npx expo start --lan --clear`
			: `EXPO_PUBLIC_API_HOST=${apiHost} npx expo start --lan --clear`;

	execSync(command, { stdio: 'inherit' });
} catch (err) {
	console.error('❌ Ошибка запуска:', err.message);
}
