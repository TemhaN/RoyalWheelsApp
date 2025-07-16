import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	Image,
	TouchableOpacity,
	Modal,
	TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getHost } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Mail, Phone, Edit2 } from 'lucide-react-native';

export default function ProfileScreen() {
	const [userData, setUserData] = useState(null);
	const [analyticsData, setAnalyticsData] = useState(null);
	const [paymentStats, setPaymentStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editData, setEditData] = useState({
		fullName: '',
		email: '',
		phoneNumber: '',
		password: '',
	});
	const navigation = useNavigation();

	useEffect(() => {
		fetchUserProfile();
	}, []);

	const fetchUserProfile = async () => {
		try {
			const host = await getHost();
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				console.log('Токен не найден');
				navigation.navigate('Login');
				setLoading(false);
				return;
			}

			const profileResponse = await fetch(`${host}/api/Profile`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (profileResponse.ok) {
				const data = await profileResponse.json();
				console.log('Контракты пользователя:', data.contracts); // Отладка
				setUserData(data);
				setEditData({
					fullName: data.fullName,
					email: data.email,
					phoneNumber: data.phoneNumber,
					password: '',
				});
			} else {
				console.error('Ошибка загрузки профиля:', await profileResponse.text());
			}

			const analyticsResponse = await fetch(`${host}/api/Analytics`, {
				headers: { Accept: '*/*', Authorization: `Bearer ${token}` },
			});
			if (analyticsResponse.ok) {
				setAnalyticsData(await analyticsResponse.json());
			} else {
				console.error(
					'Ошибка загрузки аналитики:',
					await analyticsResponse.text()
				);
			}

			const paymentStatsResponse = await fetch(
				`${host}/api/Analytics/payment-stats`,
				{
					headers: { Accept: '*/*', Authorization: `Bearer ${token}` },
				}
			);
			if (paymentStatsResponse.ok) {
				setPaymentStats(await paymentStatsResponse.json());
			} else {
				console.error(
					'Ошибка загрузки статистики платежей:',
					await paymentStatsResponse.text()
				);
			}
		} catch (error) {
			console.error('Ошибка загрузки:', error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateProfile = async () => {
		if (!editData.fullName || !editData.email || !editData.phoneNumber) {
			console.log('Ошибка: Заполните все обязательные поля');
			return;
		}

		try {
			const host = await getHost();
			const token = await AsyncStorage.getItem('token');
			const response = await fetch(`${host}/api/auth`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(editData),
			});

			if (response.ok) {
				console.log('Профиль обновлён');
				setUserData({ ...userData, ...editData });
				setModalVisible(false);
			} else {
				console.log('Ошибка обновления профиля:', await response.text());
			}
		} catch (error) {
			console.log('Ошибка подключения:', error.message);
		}
	};

	const calculateMonthlyPayment = (totalCost, leaseStartDate, leaseEndDate) => {
		const start = new Date(leaseStartDate);
		const end = new Date(leaseEndDate);
		const months =
			(end.getFullYear() - start.getFullYear()) * 12 +
			(end.getMonth() - start.getMonth());
		return months > 0 ? totalCost / months : totalCost;
	};

	const handleCarPress = carId => {
		if (!carId) {
			console.error('Некорректный carId:', carId);
			return;
		}
		console.log('Переход на CarDetails с carId:', carId);
		navigation.replace('Main', {
			screen: 'CarDetails',
			params: { carId },
		});
	};

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size='large' color='#007AFF' />
			</View>
		);
	}

	if (!userData) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>
					Не удалось загрузить данные профиля
				</Text>
			</View>
		);
	}

	return (
		<>
			<FlatList
				data={userData.contracts}
				keyExtractor={(item, index) => index.toString()}
				renderItem={({ item }) => (
					<TouchableOpacity
						onPress={() => handleCarPress(item.carId)}
						style={styles.contractCard}
					>
						<View style={styles.contractHeader}>
							{item.carPhotoUrl ? (
								<Image
									source={{ uri: item.carPhotoUrl }}
									style={styles.carImage}
									resizeMode='cover'
								/>
							) : (
								<View style={[styles.carImage, styles.placeholderImage]}>
									<Text style={styles.placeholderText}>Нет фото</Text>
								</View>
							)}
							<View style={styles.contractDetails}>
								<Text style={styles.carModel}>
									{item.carBrand} {item.carModel}
								</Text>
								<Text style={styles.contractInfo}>
									Начало:{' '}
									{new Date(item.leaseStartDate).toLocaleDateString('ru-RU')}
								</Text>
								<Text style={styles.contractInfo}>
									Окончание:{' '}
									{new Date(item.leaseEndDate).toLocaleDateString('ru-RU')}
								</Text>
								<Text style={styles.contractInfo}>
									Платеж: ₸
									{calculateMonthlyPayment(
										item.totalCost,
										item.leaseStartDate,
										item.leaseEndDate
									).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
								</Text>
								<Text style={styles.contractInfo}>
									Стоимость: ₸{item.totalCost.toLocaleString('ru-RU')}
								</Text>
								<Text
									style={[
										styles.contractStatus,
										item.status === 'Active'
											? styles.activeStatus
											: styles.completedStatus,
									]}
								>
									{item.status === 'Active' ? 'Активен' : 'Завершён'}
								</Text>
							</View>
						</View>
					</TouchableOpacity>
				)}
				ListHeaderComponent={() => (
					<View style={styles.header}>
						<Text style={styles.title}>Личный кабинет</Text>
						<View style={styles.userCard}>
							<View style={styles.avatarContainer}>
								<User color='#007AFF' size={48} />
							</View>
							<Text style={styles.userName}>{userData.fullName}</Text>
							<View style={styles.userInfoRow}>
								<Mail color='#007AFF' size={18} style={styles.icon} />
								<Text style={styles.userInfo}>{userData.email}</Text>
							</View>
							<View style={styles.userInfoRow}>
								<Phone color='#007AFF' size={18} style={styles.icon} />
								<Text style={styles.userInfo}>{userData.phoneNumber}</Text>
							</View>
							<TouchableOpacity
								style={styles.editButton}
								onPress={() => setModalVisible(true)}
							>
								<Edit2 color='#fff' size={16} style={styles.buttonIcon} />
								<Text style={styles.editButtonText}>Редактировать</Text>
							</TouchableOpacity>
						</View>
						<Text style={styles.sectionTitle}>
							Мои лизинги ({userData.contracts.length})
						</Text>
					</View>
				)}
				ListFooterComponent={() => (
					<View style={styles.analyticsSection}>
						<Text style={styles.sectionTitle}>Аналитика</Text>
						{analyticsData ? (
							<View style={styles.analyticsCard}>
								<Text style={styles.analyticsTitle}>Общая статистика</Text>
								<View style={styles.analyticsRow}>
									<Text style={styles.analyticsLabel}>Всего лизингов:</Text>
									<Text style={styles.analyticsValue}>
										{analyticsData.totalLeases}
									</Text>
								</View>
								<View style={styles.analyticsRow}>
									<Text style={styles.analyticsLabel}>Сумма платежей:</Text>
									<Text style={styles.analyticsValue}>
										₸{analyticsData.totalPayments.toLocaleString()}
									</Text>
								</View>
								<View style={styles.analyticsRow}>
									<Text style={styles.analyticsLabel}>
										Средняя длительность:
									</Text>
									<Text style={styles.analyticsValue}>
										{analyticsData.averageLeaseDurationDays.toFixed(1)} дней
									</Text>
								</View>
								<View style={styles.analyticsRow}>
									<Text style={styles.analyticsLabel}>Активных лизингов:</Text>
									<Text style={styles.analyticsValue}>
										{analyticsData.activeLeases}
									</Text>
								</View>
								<Text style={styles.analyticsSubtitle}>
									Предпочтения по брендам
								</Text>
								{analyticsData.brandPreference.length > 0 ? (
									analyticsData.brandPreference.map((brand, index) => (
										<View key={index} style={styles.analyticsRow}>
											<Text style={styles.analyticsLabel}>{brand.brand}:</Text>
											<Text style={styles.analyticsValue}>
												{brand.count} лизинг(ов)
											</Text>
										</View>
									))
								) : (
									<Text style={styles.emptyText}>Нет данных о брендах</Text>
								)}
							</View>
						) : (
							<Text style={styles.emptyText}>Аналитика недоступна</Text>
						)}
						<Text style={styles.analyticsSubtitle}>Статистика платежей</Text>
						{paymentStats && paymentStats.labels.length > 0 ? (
							<View style={styles.analyticsCard}>
								{paymentStats.labels.map((label, index) => (
									<View key={index} style={styles.analyticsRow}>
										<Text style={styles.analyticsLabel}>{label}:</Text>
										<Text style={styles.analyticsValue}>
											₸{paymentStats.data[index]?.toLocaleString() || 0}
										</Text>
									</View>
								))}
							</View>
						) : (
							<Text style={styles.emptyText}>Нет данных о платежах</Text>
						)}
					</View>
				)}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>У вас нет активных лизингов</Text>
					</View>
				)}
				contentContainerStyle={styles.container}
			/>
			<Modal
				animationType='slide'
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Редактировать профиль</Text>
						<Text style={styles.label}>ФИО</Text>
						<TextInput
							style={styles.input}
							value={editData.fullName}
							onChangeText={text =>
								setEditData({ ...editData, fullName: text })
							}
							placeholder='Введите ФИО'
							placeholderTextColor='#A0A0A0'
						/>
						<Text style={styles.label}>Email</Text>
						<TextInput
							style={styles.input}
							value={editData.email}
							onChangeText={text => setEditData({ ...editData, email: text })}
							placeholder='Введите email'
							keyboardType='email-address'
							placeholderTextColor='#A0A0A0'
						/>
						<Text style={styles.label}>Телефон</Text>
						<TextInput
							style={styles.input}
							value={editData.phoneNumber}
							onChangeText={text =>
								setEditData({ ...editData, phoneNumber: text })
							}
							placeholder='Введите номер телефона'
							keyboardType='phone-pad'
							placeholderTextColor='#A0A0A0'
						/>
						<Text style={styles.label}>Новый пароль (необязательно)</Text>
						<TextInput
							style={styles.input}
							value={editData.password}
							onChangeText={text =>
								setEditData({ ...editData, password: text })
							}
							placeholder='Введите новый пароль'
							secureTextEntry
							placeholderTextColor='#A0A0A0'
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.modalButtonText}>Отмена</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.saveButton]}
								onPress={handleUpdateProfile}
							>
								<Text style={styles.modalButtonText}>Сохранить</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#F6F8FA',
		padding: 16,
		paddingBottom: 80,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F6F8FA',
	},
	errorText: {
		fontSize: 16,
		color: '#FF3B30',
		textAlign: 'center',
		marginTop: 20,
	},
	header: {
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1C2526',
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#1C2526',
		marginBottom: 12,
		marginTop: 8,
	},
	userCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
		alignItems: 'center',
	},
	avatarContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: '#E6F0FA',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 12,
	},
	userName: {
		fontSize: 20,
		fontWeight: '600',
		color: '#1C2526',
		marginBottom: 12,
	},
	userInfoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		width: '90%',
	},
	icon: {
		marginRight: 8,
	},
	userInfo: {
		fontSize: 15,
		color: '#475467',
		flex: 1,
	},
	editButton: {
		flexDirection: 'row',
		backgroundColor: '#007AFF',
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginTop: 12,
		alignItems: 'center',
	},
	editButtonText: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '600',
		marginLeft: 6,
	},
	buttonIcon: {
		marginRight: 6,
	},
	contractCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
		overflow: 'hidden',
	},
	contractHeader: {
		flexDirection: 'row',
		padding: 12,
	},
	carImage: {
		width: 120,
		height: 80,
		borderRadius: 8,
		marginRight: 12,
	},
	placeholderImage: {
		backgroundColor: '#E5E7EB',
		justifyContent: 'center',
		alignItems: 'center',
	},
	placeholderText: {
		color: '#6B7280',
		fontSize: 14,
	},
	contractDetails: {
		flex: 1,
		justifyContent: 'space-between',
	},
	carModel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1C2526',
		marginBottom: 4,
	},
	contractInfo: {
		fontSize: 13,
		color: '#475467',
		marginBottom: 2,
	},
	contractStatus: {
		fontSize: 12,
		fontWeight: '600',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 12,
		textAlign: 'center',
		marginTop: 4,
		width: 80,
	},
	activeStatus: {
		backgroundColor: '#E6F4E6',
		color: '#2A7D2E',
	},
	completedStatus: {
		backgroundColor: '#FEE2E2',
		color: '#B91C1C',
	},
	emptyContainer: {
		alignItems: 'center',
		marginVertical: 24,
	},
	emptyText: {
		fontSize: 15,
		color: '#475467',
		textAlign: 'center',
	},
	analyticsSection: {
		marginTop: 16,
		marginBottom: 24,
	},
	analyticsCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
	},
	analyticsTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#1C2526',
		marginBottom: 12,
	},
	analyticsSubtitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1C2526',
		marginBottom: 8,
		marginTop: 12,
	},
	analyticsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	analyticsLabel: {
		fontSize: 14,
		color: '#475467',
		flex: 1,
	},
	analyticsValue: {
		fontSize: 14,
		fontWeight: '500',
		color: '#1C2526',
		textAlign: 'right',
		flex: 1,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 24,
		width: '90%',
		maxWidth: 360,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 12,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1C2526',
		textAlign: 'center',
		marginBottom: 20,
	},
	label: {
		fontSize: 14,
		fontWeight: '500',
		color: '#1C2526',
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#F9FAFB',
		borderRadius: 8,
		padding: 12,
		fontSize: 15,
		color: '#1C2526',
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 16,
	},
	modalButton: {
		flex: 1,
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: 'center',
		marginHorizontal: 6,
	},
	cancelButton: {
		backgroundColor: '#FF3B30',
	},
	saveButton: {
		backgroundColor: '#007AFF',
	},
	modalButtonText: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '600',
	},
});
