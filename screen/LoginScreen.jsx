import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; // Импортируем jwt-decode
import { getHost } from '../constants';
import { Mail, Lock, Car } from 'lucide-react-native';

export default function LoginScreen({ navigation }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async () => {
		setError('');
		setIsLoading(true);

		if (!email || !password) {
			setError('Введите email и пароль');
			console.log('Ошибка: Введите email и пароль');
			Alert.alert('Ошибка', 'Введите email и пароль');
			setIsLoading(false);
			return;
		}

		try {
			const host = await getHost();
			
			console.log('Отправка запроса на:', `${host}/api/auth/login`);
			console.log('Тело запроса:', JSON.stringify({ email, password }));

			const response = await fetch(`${host}/api/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			console.log('Статус ответа:', response.status);
			console.log('Заголовки ответа:', response.headers.get('content-type'));

			let responseData;
			try {
				responseData = await response.json();
				console.log('Получен ответ:', responseData);
			} catch (jsonError) {
				console.error('Ошибка парсинга JSON:', jsonError.message);
				setError('Некорректный ответ сервера');
				Alert.alert('Ошибка', 'Некорректный ответ сервера');
				setIsLoading(false);
				return;
			}

			if (response.ok) {
				if (!responseData.token) {
					console.log('Ошибка: Токен не получен в ответе');
					setError('Токен не предоставлен сервером');
					Alert.alert('Ошибка', 'Токен не предоставлен сервером');
					setIsLoading(false);
					return;
				}

				await AsyncStorage.setItem('token', responseData.token);
				console.log('Токен сохранен:', responseData.token);

				const decodedToken = jwtDecode(responseData.token);
				const userRole =
					decodedToken[
						'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
					];
				console.log('Роль пользователя:', userRole);

				if (userRole === 'Admin') {
					console.log('Переход на AdminScreen');
					navigation.navigate('Admin');
				} else {
					console.log('Переход на Main -> Home');
					navigation.navigate('Main', { screen: 'Home' });
				}
				console.log('Навигация выполнена');
			} else {
				console.log('Сообщение об ошибке от сервера:', responseData.message);
				setError(responseData.message || 'Произошла ошибка при входе');
				Alert.alert(
					'Ошибка',
					responseData.message || 'Произошла ошибка при входе'
				);
			}
		} catch (error) {
			console.error('Ошибка запроса:', error.message);
			setError('Не удалось подключиться к серверу');
			Alert.alert('Ошибка', 'Не удалось подключиться к серверу');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.logoContainer}>
				<Car width={36} height={36} color='#1A56DB' />
				<Text style={styles.logoText}>RoyalWheels</Text>
			</View>
			<Text style={styles.title}>Вход</Text>
			{error ? <Text style={styles.errorText}>{error}</Text> : null}
			<View style={styles.inputContainer}>
				<Mail width={20} height={20} color='#6B7280' />
				<TextInput
					style={styles.input}
					placeholder='Email'
					placeholderTextColor='#A0A0A0'
					value={email}
					onChangeText={setEmail}
					keyboardType='email-address'
					autoCapitalize='none'
				/>
			</View>
			<View style={styles.inputContainer}>
				<Lock width={20} height={20} color='#6B7280' />
				<TextInput
					style={styles.input}
					placeholder='Пароль'
					placeholderTextColor='#A0A0A0'
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoCapitalize='none'
				/>
			</View>
			<TouchableOpacity
				style={[styles.button, isLoading && styles.buttonDisabled]}
				onPress={handleLogin}
				disabled={isLoading}
				activeOpacity={0.7}
			>
				{isLoading ? (
					<ActivityIndicator color='#FFFFFF' />
				) : (
					<Text style={styles.buttonText}>Войти</Text>
				)}
			</TouchableOpacity>
			<TouchableOpacity
				onPress={() => navigation.navigate('Register')}
				style={styles.registerLink}
				activeOpacity={0.7}
			>
				<Text style={styles.registerText}>
					Нет аккаунта? Зарегистрироваться
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F6F8FA',
		paddingHorizontal: 24,
	},
	logoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 32,
	},
	logoText: {
		fontSize: 28,
		fontWeight: '700',
		color: '#1A56DB',
		marginLeft: 12,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1C2526',
		marginBottom: 16,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		height: 48,
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		paddingHorizontal: 12,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	input: {
		flex: 1,
		marginLeft: 8,
		fontSize: 15,
		color: '#1C2526',
	},
	button: {
		backgroundColor: '#1A56DB',
		borderRadius: 12,
		width: '100%',
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	buttonDisabled: {
		backgroundColor: '#6B7280',
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	errorText: {
		color: '#FF3B30',
		fontSize: 14,
		marginBottom: 16,
		textAlign: 'center',
	},
	registerLink: {
		marginTop: 20,
	},
	registerText: {
		color: '#1A56DB',
		fontSize: 14,
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
});
