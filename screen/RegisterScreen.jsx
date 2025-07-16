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
import { getHost } from '../constants';
import { User, Mail, Phone, Lock, Car } from 'lucide-react-native';

export default function RegisterScreen({ navigation }) {
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [password, setPassword] = useState('');
	const [isAgreed, setIsAgreed] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const validateInputs = () => {
		if (!fullName || !email || !phoneNumber || !password)
			return 'Все поля обязательны';
		if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Некорректный email';
		if (!phoneNumber.match(/^\+?\d{10,15}$/))
			return 'Некорректный номер телефона';
		if (password.length < 6) return 'Пароль должен быть ≥ 6 символов';
		if (!isAgreed) return 'Необходимо согласиться с политикой';
		return null;
	};

	const handleRegister = async () => {
		const validationError = validateInputs();
		if (validationError) {
			setErrorMessage(validationError);
			console.log('Ошибка:', validationError);
			Alert.alert('Ошибка', validationError);
			setIsLoading(false);
			return;
		}

		setErrorMessage('');
		setIsLoading(true);

		try {
			const host = await getHost();

			console.log('Отправка запроса на:', `${host}/api/auth/register`);
			console.log('Данные:', { fullName, email, phoneNumber, password });

			const response = await fetch(`${host}/api/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fullName, email, phoneNumber, password }),
			});

			console.log('Статус:', response.status);
			console.log('Заголовки ответа:', response.headers.get('content-type'));

			let responseData;
			try {
				responseData = await response.json();
				console.log('Ответ:', responseData);
			} catch (jsonError) {
				console.error('Ошибка парсинга JSON:', jsonError.message);
				setErrorMessage('Некорректный ответ сервера');
				Alert.alert('Ошибка', 'Некорректный ответ сервера');
				setIsLoading(false);
				return;
			}

			if (response.ok) {
				if (!responseData.token) {
					console.log('Ошибка: Токен не получен в ответе');
					setErrorMessage('Токен не предоставлен сервером');
					Alert.alert('Ошибка', 'Токен не предоставлен сервером');
					setIsLoading(false);
					return;
				}

				await AsyncStorage.setItem('token', responseData.token);
				console.log('Токен сохранён:', responseData.token);
				console.log('Переход на Main -> Home');
				navigation.navigate('Main', { screen: 'Home' });
				console.log('Навигация выполнена');
			} else {
				const errorMessage =
					responseData.message ||
					responseData.error ||
					'Ошибка при регистрации';
				setErrorMessage(errorMessage);
				console.log('Ошибка:', errorMessage);
				Alert.alert('Ошибка', errorMessage);
			}
		} catch (error) {
			console.error('Ошибка запроса:', error.message);
			setErrorMessage('Не удалось подключиться к серверу');
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
			<Text style={styles.title}>Регистрация</Text>
			{errorMessage ? (
				<Text style={styles.errorText}>{errorMessage}</Text>
			) : null}
			{/* Убрали лишний View, поля ввода напрямую */}
			<View style={styles.inputContainer}>
				<User width={20} height={20} color='#6B7280' />
				<TextInput
					style={styles.input}
					placeholder='Полное имя'
					placeholderTextColor='#A0A0A0'
					value={fullName}
					onChangeText={setFullName}
					autoCapitalize='words'
				/>
			</View>
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
				<Phone width={20} height={20} color='#6B7280' />
				<TextInput
					style={styles.input}
					placeholder='Телефон'
					placeholderTextColor='#A0A0A0'
					value={phoneNumber}
					onChangeText={setPhoneNumber}
					keyboardType='phone-pad'
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
			<View style={styles.checkboxContainer}>
				<TouchableOpacity
					style={[
						styles.checkbox,
						isAgreed ? styles.checkboxChecked : styles.checkboxUnchecked,
					]}
					onPress={() => setIsAgreed(!isAgreed)}
				>
					{isAgreed && <Text style={styles.checkboxTick}>✓</Text>}
				</TouchableOpacity>
				<Text style={styles.checkboxText}>
					Я согласен с{' '}
					<Text
						style={styles.policyLink}
						onPress={() => navigation.navigate('Policy')}
					>
						политикой соглашения
					</Text>
				</Text>
			</View>
			<TouchableOpacity
				style={[styles.button, isLoading && styles.buttonDisabled]}
				onPress={handleRegister}
				disabled={isLoading}
				activeOpacity={0.7}
			>
				{isLoading ? (
					<ActivityIndicator color='#FFFFFF' />
				) : (
					<Text style={styles.buttonText}>Зарегистрироваться</Text>
				)}
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.loginLink}
				onPress={() => navigation.navigate('Login')}
				activeOpacity={0.7}
			>
				<Text style={styles.loginText}>Уже есть аккаунт? Войти</Text>
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
	errorText: {
		color: '#FF3B30',
		fontSize: 14,
		marginBottom: 16,
		textAlign: 'center',
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
		flexShrink: 0, // Предотвращаем сжатие
	},
	input: {
		flex: 1,
		marginLeft: 8,
		fontSize: 15,
		color: '#1C2526',
		width: '100%', // Явно задаём ширину
	},
	checkboxContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		marginBottom: 16,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 2,
		borderColor: '#6B7280',
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxChecked: {
		backgroundColor: '#1A56DB',
		borderColor: '#1A56DB',
	},
	checkboxUnchecked: {
		backgroundColor: '#FFFFFF',
	},
	checkboxTick: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: 'bold',
	},
	checkboxText: {
		fontSize: 14,
		color: '#1C2526',
		marginLeft: 8,
	},
	policyLink: {
		color: '#1A56DB',
		textDecorationLine: 'underline',
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
	loginLink: {
		marginTop: 20,
	},
	loginText: {
		color: '#1A56DB',
		fontSize: 14,
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
});
