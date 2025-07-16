import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Modal,
	Alert,
} from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSequence,
	withSpring,
} from 'react-native-reanimated';
import { getHost } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, Car } from 'lucide-react-native';

export default function PaymentScreen({ route, navigation }) {
	const { leaseDetails } = route.params;
	const [cardNumber, setCardNumber] = useState('');
	const [cardHolder, setCardHolder] = useState('');
	const [expiryDate, setExpiryDate] = useState('');
	const [cvv, setCvv] = useState('');
	const [isAgreed, setIsAgreed] = useState(false); // Добавляем состояние для чекбокса
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [errorMessage, setErrorMessage] = useState(''); // Добавляем для отображения ошибки

	const buttonScale = useSharedValue(1);
	const buttonOpacity = useSharedValue(1);
	const checkmarkOpacity = useSharedValue(0);
	const checkmarkScale = useSharedValue(0);
	const modalOpacity = useSharedValue(0);

	const statusToDisplayMap = {
		Available: 'Доступен',
		Reserved: 'Забронирован',
		Leased: 'В лизинге',
	};

	const leaseStatusToDisplayMap = {
		Active: 'Активный',
		Completed: 'Завершён',
	};

	const formatCardNumber = text => {
		const cleaned = text.replace(/\D/g, '').slice(0, 16);
		const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
		return formatted;
	};

	const handleCardNumberChange = text => {
		setCardNumber(formatCardNumber(text));
	};

	const formatCardHolder = text => {
		return text
			.replace(/[^a-zA-Z\s]/g, '')
			.slice(0, 30)
			.toUpperCase();
	};

	const formatExpiryDate = text => {
		const cleaned = text.replace(/\D/g, '').slice(0, 4);
		if (cleaned.length > 2) {
			return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
		}
		return cleaned;
	};

	const validateExpiryDate = text => {
		if (text.length === 5) {
			const [month, year] = text.split('/').map(Number);
			const currentYear = new Date().getFullYear() % 100;
			const currentMonth = new Date().getMonth() + 1;
			if (
				month < 1 ||
				month > 12 ||
				year < currentYear ||
				(year === currentYear && month < currentMonth)
			) {
				Alert.alert('Ошибка', 'Недействительная дата истечения карты');
				return false;
			}
		}
		return true;
	};

	const handleExpiryDateChange = text => {
		const formatted = formatExpiryDate(text);
		if (validateExpiryDate(formatted) || formatted.length < 5) {
			setExpiryDate(formatted);
		}
	};

	const handleCvvChange = text => {
		setCvv(text.replace(/\D/g, '').slice(0, 3));
	};

	const validateInputs = () => {
		if (!cardNumber.replace(/\s/g, '')) return 'Введите номер карты';
		if (!cardHolder) return 'Введите имя владельца карты';
		if (!expiryDate) return 'Введите дату истечения карты';
		if (!cvv) return 'Введите CVV';
		if (!isAgreed) return 'Необходимо согласиться с политикой';
		return null;
	};

	const handlePayment = async () => {
		console.log('handlePayment called', {
			cardNumber,
			cardHolder,
			expiryDate,
			cvv,
			isAgreed,
			leaseDetails,
		});

		const validationError = validateInputs();
		if (validationError) {
			setErrorMessage(validationError);
			Alert.alert('Ошибка', validationError);
			return;
		}

		setErrorMessage('');
		setIsProcessing(true);
		buttonScale.value = withSequence(
			withTiming(0.95, { duration: 100 }),
			withTiming(1, { duration: 100 })
		);

		try {
			const host = await getHost();
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				setIsProcessing(false);
				Alert.alert('Ошибка', 'Требуется авторизация.');
				navigation.navigate('Login');
				return;
			}

			const userId = await AsyncStorage.getItem('userId');
			if (!userId) {
				setIsProcessing(false);
				Alert.alert('Ошибка', 'ID пользователя не найден.');
				return;
			}
			console.log('Current userId:', userId); // Логирование userId

			// Проверка статуса автомобиля
			const carResponse = await fetch(
				`${host}/api/cars/${leaseDetails.carId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (!carResponse.ok) {
				throw new Error('Ошибка загрузки данных автомобиля.');
			}
			const carData = await carResponse.json();
			if (carData.status !== 'Available' && carData.status !== 'Reserved') {
				setIsProcessing(false);
				Alert.alert('Ошибка', 'Автомобиль недоступен для бронирования.');
				return;
			}

			// Проверка бронирований для Reserved автомобиля
			let shouldCreateReservation = carData.status !== 'Reserved';
			if (carData.status === 'Reserved') {
				try {
					const reservationResponse = await fetch(
						`${host}/api/reservations?carId=${leaseDetails.carId}`,
						{
							method: 'GET',
							headers: { Authorization: `Bearer ${token}` },
						}
					);
					if (!reservationResponse.ok) {
						setIsProcessing(false);
						Alert.alert('Ошибка', 'Не удалось загрузить данные бронирования.');
						return;
					}
					const reservations = await reservationResponse.json();
					console.log('Reservations:', reservations);
					const isUserReservation = reservations.some(
						res =>
							res.userId === parseInt(userId) &&
							new Date(res.reservationEnd) > new Date()
					);
					if (!isUserReservation) {
						setIsProcessing(false);
						Alert.alert(
							'Ошибка',
							'Автомобиль забронирован другим пользователем.'
						);
						return;
					}
				} catch (error) {
					setIsProcessing(false);
					Alert.alert('Ошибка', 'Не удалось проверить бронирование.');
					console.error('Reservation check error:', error.message);
					return;
				}
			}

			// Создание бронирования только для Available автомобиля
			if (shouldCreateReservation) {
				const reservationStart = new Date();
				const reservationEnd = new Date(reservationStart);
				reservationEnd.setHours(reservationStart.getHours() + 24);

				const reservationRequest = {
					carId: leaseDetails.carId,
					reservationStart: reservationStart.toISOString(),
					reservationEnd: reservationEnd.toISOString(),
				};
				const reservationResponse = await fetch(`${host}/api/reservations`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(reservationRequest),
				});

				if (!reservationResponse.ok) {
					throw new Error(await reservationResponse.text());
				}
			}

			// Создание лизинга
			const leaseStartDate = new Date();
			const leaseEndDate = new Date();
			leaseEndDate.setMonth(leaseStartDate.getMonth() + leaseDetails.leaseTerm);

			const leaseRequest = {
				userId: parseInt(userId),
				carId: leaseDetails.carId,
				leaseStartDate: leaseStartDate.toISOString(),
				leaseEndDate: leaseEndDate.toISOString(),
			};
			const leaseResponse = await fetch(`${host}/api/lease`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(leaseRequest),
			});

			if (!leaseResponse.ok) {
				throw new Error(await leaseResponse.text());
			}

			const leaseResponseData = await leaseResponse.json();
			console.log('Lease response data:', leaseResponseData);
			const leaseContractId = leaseResponseData.id;
			if (!leaseContractId) {
				throw new Error('ID договора лизинга не получен.');
			}

			// Обновление профиля
			const profileResponse = await fetch(`${host}/api/Profile`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (profileResponse.ok) {
				const profileData = await profileResponse.json();
				console.log('Updated profile data:', profileData);
			} else {
				console.error(
					'Ошибка обновления профиля:',
					await profileResponse.text()
				);
			}

			const paymentRequest = {
				id: leaseContractId,
				paymentDate: new Date().toISOString(),
				amount: parseFloat(leaseDetails.downPayment),
				isPaid: true,
			};
			const paymentResponse = await fetch(`${host}/api/payments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(paymentRequest),
			});

			if (!paymentResponse.ok) {
				throw new Error(await paymentResponse.text());
			}

			setIsSuccess(true);
			checkmarkOpacity.value = withTiming(1, { duration: 300 });
			checkmarkScale.value = withSpring(1, { damping: 10, stiffness: 100 });
			modalOpacity.value = withTiming(1, { duration: 500 });

			setTimeout(() => {
				setIsSuccess(false);
				modalOpacity.value = withTiming(0, { duration: 500 });
				navigation.navigate('Main', { screen: 'Profile' });
			}, 3000);
		} catch (error) {
			setIsProcessing(false);
			setErrorMessage(error.message || 'Не удалось оформить лизинг.');
			buttonScale.value = withSequence(
				withTiming(0.9, { duration: 50 }),
				withTiming(1.1, { duration: 50 }),
				withTiming(0.9, { duration: 50 }),
				withTiming(1, { duration: 50 })
			);
			console.error('Payment error:', error.message);
			Alert.alert('Ошибка', error.message || 'Не удалось оформить лизинг.');
		}
	};

	const getCarStatusStyle = status => {
		switch (status) {
			case 'Available':
				return styles.statusAvailable;
			case 'Reserved':
				return styles.statusReserved;
			case 'Leased':
				return styles.statusLeased;
			default:
				return styles.leaseDetail;
		}
	};

	const getLeaseStatusStyle = status => {
		switch (status) {
			case 'Active':
				return styles.leaseStatusActive;
			case 'Completed':
				return styles.leaseStatusCompleted;
			default:
				return styles.leaseDetail;
		}
	};

	const leaseEndDate = new Date();
	leaseEndDate.setMonth(leaseEndDate.getMonth() + leaseDetails.leaseTerm);
	const leaseStatus = leaseEndDate > new Date() ? 'Active' : 'Completed';

	const animatedButtonStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buttonScale.value }],
		opacity: buttonOpacity.value,
	}));

	const animatedCheckmarkStyle = useAnimatedStyle(() => ({
		opacity: checkmarkOpacity.value,
		transform: [{ scale: checkmarkScale.value }],
	}));

	const animatedModalStyle = useAnimatedStyle(() => ({
		opacity: modalOpacity.value,
	}));

	return (
		<View style={styles.container}>
			<View style={styles.leaseInfo}>
				<Text style={styles.title}>Информация о лизинге</Text>
				<Text style={styles.leaseDetail}>
					Автомобиль:{' '}
					<Text style={styles.leaseValue}>
						{leaseDetails.carBrand} {leaseDetails.carModel}
					</Text>
				</Text>
				{leaseDetails.status && (
					<Text style={styles.leaseDetail}>
						Статус автомобиля:{' '}
						<Text
							style={[
								styles.leaseValue,
								getCarStatusStyle(leaseDetails.status),
							]}
						>
							{statusToDisplayMap[leaseDetails.status] || leaseDetails.status}
						</Text>
					</Text>
				)}
				<Text style={styles.leaseDetail}>
					Статус лизинга:{' '}
					<Text style={[styles.leaseValue, getLeaseStatusStyle(leaseStatus)]}>
						{leaseStatusToDisplayMap[leaseStatus]}
					</Text>
				</Text>
				<Text style={styles.leaseDetail}>
					Ежемесячный платеж:{' '}
					<Text style={styles.leaseValue}>₸{leaseDetails.monthlyPayment}</Text>
				</Text>
				<Text style={styles.leaseDetail}>
					Первоначальный взнос:{' '}
					<Text style={styles.leaseValue}>₸{leaseDetails.downPayment}</Text>
				</Text>
				<Text style={styles.leaseDetail}>
					Срок:{' '}
					<Text style={styles.leaseValue}>{leaseDetails.leaseTerm} мес.</Text>
				</Text>
			</View>

			<Text style={styles.sectionTitle}>Данные карты</Text>
			{errorMessage ? (
				<Text style={styles.errorText}>{errorMessage}</Text>
			) : null}
			<View style={styles.formContainer}>
				<TextInput
					style={styles.input}
					placeholder='XXXX XXXX XXXX XXXX'
					keyboardType='numeric'
					value={cardNumber}
					onChangeText={handleCardNumberChange}
					maxLength={19}
				/>
				<TextInput
					style={styles.input}
					placeholder='ИМЯ ВЛАДЕЛЬЦА'
					value={cardHolder}
					onChangeText={text => setCardHolder(formatCardHolder(text))}
					maxLength={30}
				/>
				<View style={styles.row}>
					<TextInput
						style={[styles.input, styles.smallInput]}
						placeholder='MM/YY'
						keyboardType='numeric'
						value={expiryDate}
						onChangeText={handleExpiryDateChange}
						maxLength={5}
					/>
					<TextInput
						style={[styles.input, styles.smallInput]}
						placeholder='CVV'
						keyboardType='numeric'
						value={cvv}
						onChangeText={handleCvvChange}
						maxLength={3}
						secureTextEntry
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
			</View>

			<Animated.View
				style={[styles.paymentButtonContainer, animatedButtonStyle]}
			>
				<TouchableOpacity
					style={[
						styles.paymentButton,
						(isProcessing || isSuccess) && styles.buttonDisabled,
					]}
					onPress={() => {
						console.log('Payment button pressed');
						if (!isProcessing && !isSuccess) {
							handlePayment();
						}
					}}
					disabled={isProcessing || isSuccess}
				>
					{isProcessing && !isSuccess ? (
						<ActivityIndicator color='#fff' />
					) : isSuccess ? (
						<Animated.View style={animatedCheckmarkStyle}>
							<Check color='#fff' size={24} />
						</Animated.View>
					) : (
						<Text style={styles.paymentButtonText}>Оплатить</Text>
					)}
				</TouchableOpacity>
			</Animated.View>

			<Modal visible={isSuccess} transparent={true}>
				<Animated.View style={[styles.modalContainer, animatedModalStyle]}>
					<View style={styles.modalContent}>
						<Car color='#28a745' size={60} />
						<Text style={styles.modalTitle}>Лизинг оформлен успешно!</Text>
						<Text style={styles.modalText}>
							Вы взяли в лизинг автомобиль{' '}
							<Text style={styles.modalHighlight}>
								{leaseDetails.carBrand} {leaseDetails.carModel}
							</Text>
							. Подробности доступны в вашем профиле.
						</Text>
						<Text style={styles.modalSubText}>
							Перенаправление на главную через 3 секунды...
						</Text>
					</View>
				</Animated.View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f9f9f9',
	},
	leaseInfo: {
		marginBottom: 20,
		padding: 15,
		backgroundColor: '#fff',
		borderRadius: 10,
		shadowColor: '#333',
		shadowOpacity: 0.1,
		shadowRadius: 5,
		shadowOffset: { width: 0, height: 2 },
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
	},
	leaseDetail: {
		fontSize: 16,
		marginBottom: 5,
		color: '#555',
	},
	leaseValue: {
		fontWeight: 'bold',
		color: '#333',
	},
	statusAvailable: {
		color: '#28a745',
		backgroundColor: '#e6f4e6',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
	statusReserved: {
		color: '#ffa500',
		backgroundColor: '#fff4e6',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
	statusLeased: {
		color: '#dc3545',
		backgroundColor: '#f8e6e6',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
	leaseStatusActive: {
		color: '#28a745',
		backgroundColor: '#e6f4e6',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
	leaseStatusCompleted: {
		color: '#6c757d',
		backgroundColor: '#e9ecef',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
	},
	formContainer: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 12,
		marginBottom: 16,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
		fontSize: 16,
		backgroundColor: '#fff',
		color: '#333',
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	smallInput: {
		width: '48%',
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
	errorText: {
		color: '#FF3B30',
		fontSize: 14,
		marginBottom: 10,
		textAlign: 'center',
	},
	paymentButtonContainer: {
		marginTop: 20,
	},
	paymentButton: {
		backgroundColor: '#1a1a2e',
		borderRadius: 8,
		paddingVertical: 15,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 50,
	},
	buttonDisabled: {
		backgroundColor: '#6b7280',
	},
	paymentButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 20,
		alignItems: 'center',
		width: '80%',
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 10,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#28a745',
		marginTop: 10,
		marginBottom: 10,
	},
	modalText: {
		fontSize: 16,
		color: '#555',
		textAlign: 'center',
		marginBottom: 10,
	},
	modalHighlight: {
		fontWeight: 'bold',
		color: '#333',
	},
	modalSubText: {
		fontSize: 14,
		color: '#888',
		marginTop: 10,
	},
});
