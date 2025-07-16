import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	TextInput,
	Modal,
	ScrollView,
	Image,
	Platform,
	SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import { getHost } from '../constants';
import {
	User,
	Car,
	FileText,
	Calendar,
	Heart,
	Star,
	Search,
} from 'lucide-react-native';
import Header from '../components/Header';

const AdminScreen = ({ navigation }) => {
	const [activeTab, setActiveTab] = useState('users');
	const [data, setData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [formData, setFormData] = useState({});
	const [error, setError] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [itemToDelete, setItemToDelete] = useState(null);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [users, setUsers] = useState([]);
	const [cars, setCars] = useState([]);
	const [leaseContracts, setLeaseContracts] = useState([]);
	const [pickerLoading, setPickerLoading] = useState(false);
	const [datePickerVisible, setDatePickerVisible] = useState(false);
	const [currentDateField, setCurrentDateField] = useState(null);

	const tabs = [
		{ id: 'users', label: 'Пользователи', icon: User },
		{ id: 'cars', label: 'Автомобили', icon: Car },
		{ id: 'lease-contracts', label: 'Лизинг', icon: FileText },
		{ id: 'payments', label: 'Платежи', icon: FileText },
		{ id: 'reservations', label: 'Брони', icon: Calendar },
		{ id: 'favorites', label: 'Избранное', icon: Heart },
		{ id: 'reviews', label: 'Отзывы', icon: Star },
	];

	useEffect(() => {
		fetchPickerData();
	}, []);

	useEffect(() => {
		setPage(1);
		setData([]);
		setHasMore(true);
		fetchData(activeTab, 1, true);
	}, [activeTab]);

	useEffect(() => {
		handleSearch();
	}, [searchQuery, data]);

	const formatDate = dateStr => {
		if (!dateStr) return 'Не указано';
		try {
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) return 'Не указано';
			return date.toLocaleDateString('ru-RU', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		} catch {
			return 'Не указано';
		}
	};

	const fetchData = async (tab, pageNum, append = false) => {
		setLoading(true);
		setError('');
		try {
			const host = await getHost();

			const token = await AsyncStorage.getItem('token');
			const response = await fetch(
				`${host}/api/admin/${tab}?page=${pageNum}&pageSize=100`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (response.ok) {
				const result = await response.json();
				console.log(`${tab} response:`, JSON.stringify(result, null, 2));
				let items = Array.isArray(result) ? result : result.items || [];
				console.log(`${tab} items (page ${pageNum}):`, items.length);

				setData(prev => (append ? [...prev, ...items] : items));
				setFilteredData(prev => (append ? [...prev, ...items] : items));
				setHasMore(items.length >= 100);
			} else {
				const errorData = await response.json();
				setError(errorData.message || 'Ошибка загрузки данных');
				setHasMore(false);
			}
		} catch (err) {
			setError('Не удалось подключиться к серверу');
			setHasMore(false);
			console.error('Fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchPickerData = async () => {
		setPickerLoading(true);
		try {
			const host = await getHost();

			const token = await AsyncStorage.getItem('token');
			const [usersResponse, carsResponse, leaseResponse] = await Promise.all([
				fetch(`${host}/api/admin/users?page=1}&pageSize=100`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${host}/api/admin/cars?page=1}&pageSize=100`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${host}/api/admin/lease-contracts?page=1}&pageSize=100`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);

			if (usersResponse.ok) {
				const usersData = await usersResponse.json();
				setUsers(Array.isArray(usersData) ? usersData : usersData.items || []);
			}
			if (carsResponse.ok) {
				const carsData = await carsResponse.json();
				setCars(Array.isArray(carsData) ? carsData : carsData.items || []);
			}
			if (leaseResponse.ok) {
				const leaseData = await leaseResponse.json();
				setLeaseContracts(
					Array.isArray(leaseData) ? leaseData : leaseData.items || []
				);
			}
		} catch (err) {
			console.error('Error fetching picker data:', err);
			setError('Ошибка загрузки данных для формы');
		} finally {
			setPickerLoading(false);
		}
	};

	const handleSearch = () => {
		if (!searchQuery) {
			setFilteredData(data);
			console.log('Search: No query, showing all data:', data.length);
			return;
		}
		const lowerQuery = searchQuery.toLowerCase();
		const filtered = data.filter(item => {
			const text = getItemDisplayText(item).toLowerCase();
			return text.includes(lowerQuery);
		});
		setFilteredData(filtered);
		console.log('Search: Filtered data:', filtered.length);
	};

	const handleCreateOrUpdate = async () => {
		setError('');
		try {
			const host = await getHost();

			const token = await AsyncStorage.getItem('token');
			const method = editItem ? 'PUT' : 'POST';
			const url = editItem
				? `${host}/api/admin/${activeTab}/${editItem.id}`
				: `${host}/api/admin/${activeTab}`;

			const body = { ...formData };
			if (!editItem) {
				delete body.id;
			}

			// Форматируем даты в ISO строку
			Object.keys(body).forEach(key => {
				if (body[key] instanceof Date) {
					body[key] = body[key].toISOString().split('T')[0];
				}
			});

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			});

			if (response.ok) {
				setModalVisible(false);
				setEditItem(null);
				setFormData({});
				setPage(1);
				fetchData(activeTab, 1, false);
			} else {
				const errorData = await response.json();
				setError(errorData.message || 'Ошибка сохранения');
			}
		} catch (err) {
			setError('Не удалось подключиться к серверу.');
		}
	};

	const handleDelete = id => {
		setItemToDelete(id);
		setDeleteModalVisible(true);
	};

	const confirmDelete = async () => {
		try {
			const host = await getHost();

			const token = await AsyncStorage.getItem('token');
			const response = await fetch(
				`${host}/api/admin/${activeTab}/${itemToDelete}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (response.ok) {
				setDeleteModalVisible(false);
				setPage(1);
				fetchData(activeTab, 1, false);
			} else {
				const errorData = await response.json();
				setError(errorData.message || 'Ошибка удаления');
			}
		} catch (err) {
			setError('Не удалось подключиться к серверу.');
		}
	};

	const openModal = (item = null) => {
		setEditItem(item);
		// Преобразуем строки дат в объекты Date
		const initialFormData = { ...item } || {};
		if (item) {
			[
				'leaseStartDate',
				'leaseEndDate',
				'paymentDate',
				'reservationStart',
				'reservationEnd',
			].forEach(key => {
				if (item[key]) {
					initialFormData[key] = new Date(item[key]);
				}
			});
		}
		setFormData(initialFormData);
		setModalVisible(true);
	};

	const openDatePicker = fieldKey => {
		setCurrentDateField(fieldKey);
		setDatePickerVisible(true);
	};

	const handleDateConfirm = date => {
		setFormData({
			...formData,
			[currentDateField]: date,
		});
		setDatePickerVisible(false);
		setCurrentDateField(null);
	};

	const mapRole = role => {
		switch (role) {
			case 0:
				return 'User';
			case 1:
				return 'Admin';
			default:
				return 'Unknown';
		}
	};

	const renderItem = ({ item }) => {
		console.log(`Rendering item ID ${item.id} for tab ${activeTab}`);
		if (activeTab === 'cars') {
			return (
				<View style={styles.card}>
					{item.photoUrl ? (
						<Image
							source={{ uri: item.photoUrl }}
							style={styles.carImage}
							resizeMode='contain'
						/>
					) : (
						<View style={[styles.carImage, styles.placeholderImage]}>
							<Text style={styles.placeholderText}>Нет фото</Text>
						</View>
					)}
					<Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
					<View style={styles.cardContent}>
						<Text style={styles.cardText}>ID: {item.id}</Text>
						<Text style={styles.cardText}>Бренд: {item.brand}</Text>
						<Text style={styles.cardText}>Модель: {item.model}</Text>
						<Text style={styles.cardText}>Год: {item.year}</Text>
						<Text style={styles.cardText}>Двигатель: {item.engine}</Text>
						<Text style={styles.cardText}>Тип кузова: {item.bodyType}</Text>
						<Text style={styles.cardText}>Цена: {item.price} ₽</Text>
						<Text style={styles.cardText}>Статус: {item.status}</Text>
						<Text style={styles.cardText}>
							Средний рейтинг: {item.averageRating || 'Нет отзывов'}
						</Text>
					</View>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => openModal(item)}
							style={styles.actionButton}
						>
							<Text style={styles.actionText}>Редактировать</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleDelete(item.id)}
							style={[styles.actionButton, styles.deleteButton]}
						>
							<Text style={styles.actionText}>Удалить</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		} else if (activeTab === 'users') {
			return (
				<View style={styles.card}>
					<Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
					<View style={styles.cardContent}>
						<Text style={styles.cardText}>ID: {item.id}</Text>
						<Text style={styles.cardText}>
							Имя: {item.fullName || 'Не указано'}
						</Text>
						<Text style={styles.cardText}>Email: {item.email}</Text>
						<Text style={styles.cardText}>
							Телефон: {item.phoneNumber || 'Не указано'}
						</Text>
						<Text style={styles.cardText}>Роль: {mapRole(item.role)}</Text>
					</View>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => openModal(item)}
							style={styles.actionButton}
						>
							<Text style={styles.actionText}>Редактировать</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleDelete(item.id)}
							style={[styles.actionButton, styles.deleteButton]}
						>
							<Text style={styles.actionText}>Удалить</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		} else if (activeTab === 'lease-contracts') {
			return (
				<View style={styles.card}>
					<Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
					<View style={styles.cardContent}>
						<Text style={styles.cardText}>ID: {item.id}</Text>
						<Text style={styles.cardText}>
							Пользователь:{' '}
							{item.user ? item.user.fullName : `ID ${item.userId}`}
						</Text>
						<Text style={styles.cardText}>
							Авто: {item.car ? item.car.brand : `ID ${item.carId}`}
						</Text>
						<Text style={styles.cardText}>
							Начало: {formatDate(item.leaseStartDate)}
						</Text>
						<Text style={styles.cardText}>
							Окончание: {formatDate(item.leaseEndDate)}
						</Text>
						<Text style={styles.cardText}>Стоимость: {item.totalCost} ₽</Text>
					</View>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => openModal(item)}
							style={styles.actionButton}
						>
							<Text style={styles.actionText}>Редактировать</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleDelete(item.id)}
							style={[styles.actionButton, styles.deleteButton]}
						>
							<Text style={styles.actionText}>Удалить</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		} else if (activeTab === 'payments') {
			return (
				<View style={styles.card}>
					<Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
					<View style={styles.cardContent}>
						<Text style={styles.cardText}>ID: {item.id}</Text>
						<Text style={styles.cardText}>
							Договор: ID {item.leaseContractId}
						</Text>
						<Text style={styles.cardText}>
							Дата: {formatDate(item.paymentDate)}
						</Text>
						<Text style={styles.cardText}>Сумма: {item.amount} ₽</Text>
						<Text style={styles.cardText}>
							Оплачен: {item.isPaid ? 'Да' : 'Нет'}
						</Text>
					</View>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => openModal(item)}
							style={styles.actionButton}
						>
							<Text style={styles.actionText}>Редактировать</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleDelete(item.id)}
							style={[styles.actionButton, styles.deleteButton]}
						>
							<Text style={styles.actionText}>Удалить</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		} else if (activeTab === 'reservations') {
			return (
				<View style={styles.card}>
					<Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
					<View style={styles.cardContent}>
						<Text style={styles.cardText}>ID: {item.id}</Text>
						<Text style={styles.cardText}>
							Пользователь:{' '}
							{item.user ? item.user.fullName : `ID ${item.userId}`}
						</Text>
						<Text style={styles.cardText}>
							Авто: {item.car ? item.car.brand : `ID ${item.carId}`}
						</Text>
						<Text style={styles.cardText}>
							Начало: {formatDate(item.reservationStart)}
						</Text>
						<Text style={styles.cardText}>
							Окончание: {formatDate(item.reservationEnd)}
						</Text>
						<Text style={styles.cardText}>
							Активно: {item.isActive ? 'Да' : 'Нет'}
						</Text>
					</View>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => openModal(item)}
							style={styles.actionButton}
						>
							<Text style={styles.actionText}>Редактировать</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleDelete(item.id)}
							style={[styles.actionButton, styles.deleteButton]}
						>
							<Text style={styles.actionText}>Удалить</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		} else if (activeTab === 'favorites') {
			return (
				<View style={styles.card}>
					<Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
					<View style={styles.cardContent}>
						<Text style={styles.cardText}>ID: {item.id}</Text>
						<Text style={styles.cardText}>
							Пользователь:{' '}
							{item.user ? item.user.fullName : `ID ${item.userId}`}
						</Text>
						<Text style={styles.cardText}>
							Авто: {item.car ? item.car.brand : `ID ${item.carId}`}
						</Text>
					</View>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => openModal(item)}
							style={styles.actionButton}
						>
							<Text style={styles.actionText}>Редактировать</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleDelete(item.id)}
							style={[styles.actionButton, styles.deleteButton]}
						>
							<Text style={styles.actionText}>Удалить</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		} else if (activeTab === 'reviews') {
			return (
				<View style={styles.card}>
					<Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
					<View style={styles.cardContent}>
						<Text style={styles.cardText}>ID: {item.id}</Text>
						<Text style={styles.cardText}>
							Пользователь:{' '}
							{item.user ? item.user.fullName : `ID ${item.userId}`}
						</Text>
						<Text style={styles.cardText}>
							Авто: {item.car ? item.car.brand : `ID ${item.carId}`}
						</Text>
						<Text style={styles.cardText}>Рейтинг: {item.rating}</Text>
						<Text style={styles.cardText}>
							Комментарий: {item.comment || 'Нет'}
						</Text>
					</View>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => openModal(item)}
							style={styles.actionButton}
						>
							<Text style={styles.actionText}>Редактировать</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleDelete(item.id)}
							style={[styles.actionButton, styles.deleteButton]}
						>
							<Text style={styles.actionText}>Удалить</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		}
		return null;
	};

	const getItemTitle = item => {
		switch (activeTab) {
			case 'users':
				return item.fullName || `Пользователь ${item.id}`;
			case 'cars':
				return `${item.brand} ${item.model}`;
			case 'lease-contracts':
				return `Договор ${item.id}`;
			case 'payments':
				return `Платёж ${item.id}`;
			case 'reservations':
				return `Бронь ${item.id}`;
			case 'favorites':
				return `Избранное ${item.id}`;
			case 'reviews':
				return `Отзыв ${item.id}`;
			default:
				return `Элемент ${item.id}`;
		}
	};

	const getItemDisplayText = item => {
		switch (activeTab) {
			case 'users':
				return `ID: ${item.id}, Имя: ${item.fullName || 'Не указано'}, Email: ${
					item.email
				}, Телефон: ${item.phoneNumber || 'Не указано'}, Роль: ${mapRole(
					item.role
				)}`;
			case 'cars':
				return `ID: ${item.id}, Бренд: ${item.brand}, Модель: ${
					item.model
				}, Год: ${item.year}, Двигатель: ${item.engine}, Тип кузова: ${
					item.bodyType
				}, Цена: ${item.price}, Статус: ${item.status}, Средний рейтинг: ${
					item.averageRating || 'Нет отзывов'
				}`;
			case 'lease-contracts':
				return `ID: ${item.id}, Пользователь: ${
					item.user ? item.user.fullName : item.userId
				}, Авто: ${
					item.car ? item.car.brand : item.carId
				}, Начало: ${formatDate(item.leaseStartDate)}, Окончание: ${formatDate(
					item.leaseEndDate
				)}, Стоимость: ${item.totalCost}`;
			case 'payments':
				return `ID: ${item.id}, Договор: ${
					item.leaseContractId
				}, Дата: ${formatDate(item.paymentDate)}, Сумма: ${
					item.amount
				}, Оплачен: ${item.isPaid ? 'Да' : 'Нет'}`;
			case 'reservations':
				return `ID: ${item.id}, Пользователь: ${
					item.user ? item.user.fullName : item.userId
				}, Авто: ${
					item.car ? item.car.brand : item.carId
				}, Начало: ${formatDate(
					item.reservationStart
				)}, Окончание: ${formatDate(item.reservationEnd)}, Активно: ${
					item.isActive ? 'Да' : 'Нет'
				}`;
			case 'favorites':
				return `ID: ${item.id}, Пользователь: ${
					item.user ? item.user.fullName : item.userId
				}, Авто: ${item.car ? item.car.brand : item.carId}`;
			case 'reviews':
				return `ID: ${item.id}, Пользователь: ${
					item.user ? item.user.fullName : item.userId
				}, Авто: ${item.car ? item.car.brand : item.carId}, Рейтинг: ${
					item.rating
				}, Комментарий: ${item.comment || 'Нет'}`;
			default:
				return `ID: ${item.id}`;
		}
	};
	const renderForm = () => {
		const fields = getFormFields(activeTab);
		if (pickerLoading) {
			return (
				<View style={styles.modalContent}>
					<ActivityIndicator size='large' color='#1a56db' />
					<Text style={styles.modalText}>Загрузка данных...</Text>
				</View>
			);
		}
		return (
			<ScrollView style={styles.modalContent}>
				{fields.map(field => (
					<View key={field.key} style={styles.formField}>
						<Text style={styles.formLabel}>{field.label}</Text>
						{field.type === 'date' ? (
							Platform.OS === 'web' ? (
								<View style={styles.datePickerContainer}>
									<input
										type='date'
										style={styles.webDateInput}
										value={
											formData[field.key]
												? formData[field.key].toISOString().split('T')[0]
												: ''
										}
										onChange={e =>
											setFormData({
												...formData,
												[field.key]: e.target.value
													? new Date(e.target.value)
													: null,
											})
										}
										disabled={field.disabled}
									/>
								</View>
							) : (
								<TouchableOpacity
									style={styles.formInput}
									onPress={() => !field.disabled && openDatePicker(field.key)}
									disabled={field.disabled}
								>
									<Text style={styles.formInputText}>
										{formData[field.key]
											? formatDate(formData[field.key])
											: 'Выберите дату'}
									</Text>
								</TouchableOpacity>
							)
						) : field.type === 'picker' ? (
							<Picker
								selectedValue={formData[field.key] || ''}
								onValueChange={value =>
									setFormData({
										...formData,
										[field.key]: value ? Number(value) : undefined,
									})
								}
								style={styles.picker}
								enabled={!field.disabled}
							>
								<Picker.Item label='Выберите...' value='' />
								{field.options.length === 0 ? (
									<Picker.Item label='Нет данных' value='' />
								) : (
									field.options.map(option => (
										<Picker.Item
											key={option.value}
											label={option.label}
											value={option.value}
										/>
									))
								)}
							</Picker>
						) : (
							<TextInput
								style={styles.formInput}
								value={
									formData[field.key] ? formData[field.key].toString() : ''
								}
								onChangeText={text =>
									setFormData({
										...formData,
										[field.key]: field.type === 'number' ? Number(text) : text,
									})
								}
								placeholder={field.label}
								keyboardType={field.type === 'number' ? 'numeric' : 'default'}
								multiline={field.type === 'textarea'}
								numberOfLines={field.type === 'textarea' ? 4 : 1}
								editable={!field.disabled}
							/>
						)}
					</View>
				))}
				{error ? <Text style={styles.errorText}>{error}</Text> : null}
				<View style={styles.modalButtons}>
					<TouchableOpacity
						onPress={handleCreateOrUpdate}
						style={styles.submitButton}
					>
						<Text style={styles.submitButtonText}>
							{editItem ? 'Обновить' : 'Создать'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setModalVisible(false)}
						style={styles.cancelButton}
					>
						<Text style={styles.cancelButtonText}>Отмена</Text>
					</TouchableOpacity>
				</View>
				{Platform.OS !== 'web' && (
					<DatePicker
						modal
						open={datePickerVisible}
						date={formData[currentDateField] || new Date()}
						onConfirm={handleDateConfirm}
						onCancel={() => setDatePickerVisible(false)}
						mode='date'
						locale='ru'
						title='Выберите дату'
						confirmText='Подтвердить'
						cancelText='Отмена'
					/>
				)}
			</ScrollView>
		);
	};

	const renderDeleteModal = () => (
		<View style={styles.modalContainer}>
			<View style={styles.modalView}>
				<Text style={styles.modalTitle}>Подтверждение удаления</Text>
				<Text style={styles.modalText}>
					Вы уверены, что хотите удалить этот элемент?
				</Text>
				<View style={styles.modalButtons}>
					<TouchableOpacity onPress={confirmDelete} style={styles.submitButton}>
						<Text style={styles.submitButtonText}>Удалить</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setDeleteModalVisible(false)}
						style={styles.cancelButton}
					>
						<Text style={styles.cancelButtonText}>Отмена</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);

	const getFormFields = tab => {
		const baseFields = {
			users: [
				{ key: 'fullName', label: 'Полное имя', type: 'text' },
				{ key: 'email', label: 'Email', type: 'text' },
				{ key: 'phoneNumber', label: 'Телефон', type: 'text' },
				{ key: 'password', label: 'Пароль', type: 'text' },
				{ key: 'role', label: 'Роль (0=User, 1=Admin)', type: 'number' },
			],
			cars: [
				{ key: 'brand', label: 'Бренд', type: 'text' },
				{ key: 'model', label: 'Модель', type: 'text' },
				{ key: 'year', label: 'Год', type: 'number' },
				{ key: 'engine', label: 'Двигатель', type: 'text' },
				{ key: 'bodyType', label: 'Тип кузова', type: 'text' },
				{ key: 'price', label: 'Цена', type: 'number' },
				{ key: 'photoUrl', label: 'URL фото', type: 'text' },
				{
					key: 'status',
					label: 'Статус (Available/Reserved/Leased)',
					type: 'text',
				},
			],
			'lease-contracts': [
				{
					key: 'userId',
					label: 'Пользователь',
					type: 'picker',
					options: users.map(user => ({
						value: user.id,
						label: `${user.fullName} (ID: ${user.id})`,
					})),
				},
				{
					key: 'carId',
					label: 'Автомобиль',
					type: 'picker',
					options: cars.map(car => ({
						value: car.id,
						label: `${car.brand} ${car.model} (ID: ${car.id})`,
					})),
				},
				{ key: 'leaseStartDate', label: 'Дата начала', type: 'date' },
				{ key: 'leaseEndDate', label: 'Дата окончания', type: 'date' },
				{ key: 'totalCost', label: 'Общая стоимость', type: 'number' },
			],
			payments: [
				{
					key: 'leaseContractId',
					label: 'Договор лизинга',
					type: 'picker',
					options: leaseContracts.map(contract => ({
						value: contract.id,
						label: `Договор ${contract.id} (Пользователь: ${contract.userId}, Авто: ${contract.carId})`,
					})),
				},
				{ key: 'paymentDate', label: 'Дата платежа', type: 'date' },
				{ key: 'amount', label: 'Сумма', type: 'number' },
				{ key: 'isPaid', label: 'Оплачен (true/false)', type: 'text' },
			],
			reservations: [
				{
					key: 'userId',
					label: 'Пользователь',
					type: 'picker',
					options: users.map(user => ({
						value: user.id,
						label: `${user.fullName} (ID: ${user.id})`,
					})),
				},
				{
					key: 'carId',
					label: 'Автомобиль',
					type: 'picker',
					options: cars.map(car => ({
						value: car.id,
						label: `${car.brand} ${car.model} (ID: ${car.id})`,
					})),
				},
				{ key: 'reservationStart', label: 'Начало', type: 'date' },
				{ key: 'reservationEnd', label: 'Конец', type: 'date' },
				{ key: 'isActive', label: 'Активно (true/false)', type: 'text' },
			],
			favorites: [
				{
					key: 'userId',
					label: 'Пользователь',
					type: 'picker',
					options: users.map(user => ({
						value: user.id,
						label: `${user.fullName} (ID: ${user.id})`,
					})),
				},
				{
					key: 'carId',
					label: 'Автомобиль',
					type: 'picker',
					options: cars.map(car => ({
						value: car.id,
						label: `${car.brand} ${car.model} (ID: ${car.id})`,
					})),
				},
			],
			reviews: [
				{
					key: 'userId',
					label: 'Пользователь',
					type: 'picker',
					options: users.map(user => ({
						value: user.id,
						label: `${user.fullName} (ID: ${user.id})`,
					})),
				},
				{
					key: 'carId',
					label: 'Автомобиль',
					type: 'picker',
					options: cars.map(car => ({
						value: car.id,
						label: `${car.brand} ${car.model} (ID: ${car.id})`,
					})),
				},
				{ key: 'rating', label: 'Рейтинг (1-5)', type: 'number' },
				{ key: 'comment', label: 'Комментарий', type: 'textarea' },
			],
		};

		if (editItem) {
			return [
				{ key: 'id', label: 'ID', type: 'number', disabled: true },
				...(baseFields[tab] || []),
			];
		}
		return baseFields[tab] || [];
	};

	const handleEndReached = () => {
		if (!loading && hasMore) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchData(activeTab, nextPage, true);
		}
	};
	return (
		<SafeAreaView style={styles.container}>
			<Header />
			<View style={styles.headerContainer}>
				{/* Заголовок */}
				<Text style={styles.title}>Панель администратора</Text>

				{/* Поиск */}
				<View style={styles.searchContainer}>
					<Search size={20} color='#666' style={styles.searchIcon} />
					<TextInput
						style={styles.searchInput}
						placeholder='Поиск...'
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>

				{/* Вкладки */}
				<View style={styles.tabWrapper}>
					<ScrollView
						horizontal
						style={styles.tabContainer}
						contentContainerStyle={styles.tabContentContainer}
						showsHorizontalScrollIndicator={false}
					>
						{tabs.map(tab => (
							<TouchableOpacity
								key={tab.id}
								style={[styles.tab, activeTab === tab.id && styles.activeTab]}
								onPress={() => setActiveTab(tab.id)}
							>
								<tab.icon
									size={16}
									color={activeTab === tab.id ? '#FFFFFF' : '#1A56DB'}
								/>
								<Text
									style={[
										styles.tabText,
										activeTab === tab.id && styles.activeTabText,
									]}
								>
									{tab.label}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Кнопка "Добавить" */}
				<TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
					<Text style={styles.addButtonText}>+ Добавить</Text>
				</TouchableOpacity>
			</View>

			{/* Список */}
			{loading && page === 1 ? (
				<ActivityIndicator size='large' color='#1a56db' style={styles.loader} />
			) : error ? (
				<Text style={styles.errorText}>{error}</Text>
			) : (
				<FlatList
					data={filteredData}
					renderItem={renderItem}
					keyExtractor={item => String(item.id)}
					contentContainerStyle={styles.listContent}
					style={styles.list}
					scrollEnabled={true}
					onEndReached={handleEndReached}
					onEndReachedThreshold={0.5}
					ListEmptyComponent={
						<Text style={styles.emptyText}>
							Нет данных (элементов: {filteredData.length})
						</Text>
					}
					ListFooterComponent={
						loading && page > 1 ? (
							<ActivityIndicator
								size='small'
								color='#1a56db'
								style={styles.footerLoader}
							/>
						) : null
					}
				/>
			)}

			<Modal visible={modalVisible} animationType='slide' transparent={true}>
				<View style={styles.modalContainer}>
					<View style={styles.modalView}>{renderForm()}</View>
				</View>
			</Modal>

			<Modal
				visible={deleteModalVisible}
				animationType='fade'
				transparent={true}
			>
				{renderDeleteModal()}
			</Modal>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
	},
	headerContainer: {
		paddingTop: 16, // Отступ от Header
		paddingBottom: 12,
		backgroundColor: '#FFFFFF',
		borderBottomLeftRadius: 20, // Скругление углов
		borderBottomRightRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 16,
		paddingHorizontal: 20,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F3F4F6',
		borderRadius: 12,
		paddingHorizontal: 12,
		marginBottom: 12,
		marginHorizontal: 20,
		borderWidth: 0,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: '#333',
		paddingVertical: 10,
	},
	tabWrapper: {
		paddingHorizontal: 20,
		marginBottom: 12,
	},
	tabContainer: {
		height: 44,
	},
	tabContentContainer: {
		paddingHorizontal: 4,
	},
	tab: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		marginRight: 8,
		backgroundColor: '#F3F4F6',
		borderRadius: 52,
		borderWidth: 0,
	},
	activeTab: {
		backgroundColor: '#1a56db',
	},
	tabText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1a56db',
		marginLeft: 6,
	},
	activeTabText: {
		color: '#fff',
	},
	addButton: {
		backgroundColor: '#1a56db',
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
		marginBottom: 12,
		marginHorizontal: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
	},
	addButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	list: {
		flex: 1,
		paddingTop: 8,
	},
	listContent: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		marginVertical: 8,
		padding: 16,
		borderWidth: 0,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 12,
	},
	cardContent: {
		marginBottom: 12,
	},
	carImage: {
		width: '100%',
		height: 120,
		borderRadius: 12,
		marginBottom: 12,
	},
	placeholderImage: {
		backgroundColor: '#F3F4F6',
		justifyContent: 'center',
		alignItems: 'center',
	},
	placeholderText: {
		color: '#6B7280',
		fontSize: 14,
	},
	cardText: {
		fontSize: 14,
		color: '#374151',
		marginBottom: 6,
	},
	cardActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 12,
	},
	actionButton: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		backgroundColor: '#1a56db',
		borderRadius: 8,
	},
	deleteButton: {
		backgroundColor: '#ef4444',
	},
	actionText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
	loader: {
		marginTop: 24,
	},
	footerLoader: {
		marginVertical: 20,
	},
	emptyText: {
		fontSize: 16,
		color: '#6B7280',
		textAlign: 'center',
		marginTop: 24,
	},
	errorText: {
		fontSize: 14,
		color: '#ef4444',
		textAlign: 'center',
		marginVertical: 12,
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: 'rgba(0,0,0,0.3)',
	},
	modalView: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 20,
		marginHorizontal: 16,
		maxHeight: '80%',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 10,
		elevation: 5,
	},
	modalContent: {
		marginTop: 8,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 12,
		textAlign: 'center',
	},
	modalText: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 16,
		textAlign: 'center',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		marginTop: 20,
	},
	formField: {
		marginBottom: 16,
	},
	formLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#6B7280',
		marginBottom: 6,
	},
	formInput: {
		backgroundColor: '#F9FAFB',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		fontSize: 14,
		color: '#333',
	},
	formInputText: {
		fontSize: 14,
		color: '#333',
	},
	datePickerContainer: {
		backgroundColor: '#F9FAFB',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		overflow: 'hidden',
	},
	webDateInput: {
		width: '100%',
		padding: 12,
		fontSize: 14,
		color: '#333',
		backgroundColor: '#F9FAFB',
		border: 'none',
		outline: 'none',
		WebkitAppearance: 'none',
		MozAppearance: 'none',
		appearance: 'none',
	},
	picker: {
		backgroundColor: '#F9FAFB',
		borderWidth: 1,
		borderColor: '#E5E7EB',
		borderRadius: 8,
		padding: 12,
	},
	submitButton: {
		flex: 1,
		backgroundColor: '#1a56db',
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
	},
	submitButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	cancelButton: {
		flex: 1,
		backgroundColor: '#ffffff',
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ef4444',
	},
	cancelButtonText: {
		color: '#ef4444',
		fontSize: 16,
		fontWeight: '600',
	},
});

export default AdminScreen;
