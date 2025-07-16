import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Image,
	Modal,
	ScrollView,
	Alert,
} from 'react-native';
import { getHost } from '../constants';
import { Search, ChevronDown, Heart, Filter } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
	const navigation = useNavigation();
	const [cars, setCars] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [brands, setBrands] = useState(['Все марки']);
	const [years, setYears] = useState(['Все года']);
	const [statuses, setStatuses] = useState([
		'Все статусы',
		'Доступен',
		'Забронирован',
		'В лизинге',
	]);
	const [selectedBrand, setSelectedBrand] = useState('');
	const [selectedYear, setSelectedYear] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');
	const [minPrice, setMinPrice] = useState('');
	const [maxPrice, setMaxPrice] = useState('');
	const [showFilterModal, setShowFilterModal] = useState(false);
	const [showBrandModal, setShowBrandModal] = useState(false);
	const [showYearModal, setShowYearModal] = useState(false);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [favorites, setFavorites] = useState([]);
	const [brandSearchQuery, setBrandSearchQuery] = useState('');

	const statusToServerMap = {
		Доступен: 'Available',
		Забронирован: 'Reserved',
		'В лизинге': 'Leased',
	};

	const statusToDisplayMap = {
		Available: 'Доступен',
		Reserved: 'Забронирован',
		Leased: 'В лизинге',
	};

	const modalHeight =
		showBrandModal || showYearModal || showStatusModal ? '60%' : '80%';

	useEffect(() => {
		fetchCars();
		fetchFavorites();
	}, [
		selectedBrand,
		selectedYear,
		selectedStatus,
		minPrice,
		maxPrice,
		searchQuery,
	]);

	const fetchCars = async () => {
		try {
			const host = await getHost();
			
			const params = new URLSearchParams();
			if (selectedBrand && selectedBrand !== 'Все марки')
				params.append('search', selectedBrand);
			if (searchQuery) params.append('search', searchQuery);
			if (minPrice) params.append('minPrice', minPrice);
			if (maxPrice) params.append('maxPrice', maxPrice);
			if (selectedYear && selectedYear !== 'Все года')
				params.append('minYear', selectedYear);
			if (selectedStatus && selectedStatus !== 'Все статусы')
				params.append('status', statusToServerMap[selectedStatus]);

			const token = await AsyncStorage.getItem('token');
			if (!token) {
				Alert.alert(
					'Ошибка',
					'Токен не найден. Пожалуйста, войдите в аккаунт.'
				);
				navigation.navigate('Login');
				return;
			}

			const response = await fetch(
				`${host}/api/cars/search?${params.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Ошибка сервера: ${response.status}`);
			}

			const data = await response.json();
			setCars(data || []);

			const allBrands = [...new Set(data.map(car => car.brand))];
			const allYears = [...new Set(data.map(car => car.year.toString()))];
			setBrands(['Все марки', ...allBrands]);
			setYears(['Все года', ...allYears]);
		} catch (error) {
			console.error('Ошибка загрузки списка машин:', error);
			Alert.alert('Ошибка', 'Не удалось загрузить список автомобилей.');
		}
	};

	const fetchFavorites = async () => {
		try {
			const host = await getHost();
			
			const token = await AsyncStorage.getItem('token');
			if (!token) return;

			const response = await fetch(`${host}/api/cars/favorites`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				throw new Error(`Ошибка сервера: ${response.status}`);
			}
			const data = await response.json();
			setFavorites(data.map(fav => fav.id));
		} catch (error) {
			console.error('Ошибка загрузки избранного:', error);
		}
	};

	const handleToggleFavorite = async carId => {
		try {
			const host = await getHost();
			
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт.');
				navigation.navigate('Login');
				return;
			}

			const isFavorite = favorites.includes(carId);
			const method = isFavorite ? 'DELETE' : 'POST';
			const response = await fetch(`${host}/api/cars/favorites/${carId}`, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				if (isFavorite) {
					setFavorites(favorites.filter(id => id !== carId));
					Alert.alert('Успех', 'Машина убрана из избранного.');
				} else {
					setFavorites([...favorites, carId]);
					Alert.alert('Успех', 'Машина добавлена в избранное.');
				}
			} else {
				const error = await response.text();
				Alert.alert('Ошибка', error);
			}
		} catch (error) {
			Alert.alert('Ошибка', 'Не удалось выполнить операцию.');
		}
	};

	const filteredBrands = brands.filter(brand =>
		brand.toLowerCase().includes(brandSearchQuery.toLowerCase())
	);

	const getStatusStyle = status => {
		switch (status) {
			case 'Available':
				return styles.statusAvailable;
			case 'Reserved':
				return styles.statusReserved;
			case 'Leased':
				return styles.statusLeased;
			default:
				return styles.carStatus;
		}
	};

	const renderCar = ({ item }) => (
		<View style={styles.carCard}>
			<TouchableOpacity
				onPress={() =>
					navigation.replace('Main', {
						screen: 'CarDetails',
						params: { carId: item.id },
					})
				}
			>
				<Image source={{ uri: item.photoUrl }} style={styles.carImage} />
				<Text style={styles.carPrice}>₸{item.price.toLocaleString()}</Text>
				<Text style={styles.carModel}>
					{item.brand} {item.model}
				</Text>
				<Text style={styles.carYear}>{item.year}</Text>
				<Text style={styles.carDetails}>
					{item.engine} • {item.bodyType} • Рейтинг:{' '}
					{item.averageRating.toFixed(1)}
				</Text>
				<Text style={[styles.carStatus, getStatusStyle(item.status)]}>
					{statusToDisplayMap[item.status] || item.status}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.favoriteIconContainer}
				onPress={() => handleToggleFavorite(item.id)}
			>
				<Heart
					width={24}
					height={24}
					color={favorites.includes(item.id) ? '#FF0000' : '#888'}
					fill={favorites.includes(item.id) ? '#FF0000' : 'none'}
				/>
			</TouchableOpacity>
		</View>
	);
	
	const renderModal = (
		data,
		onSelect,
		onClose,
		showSearch = false,
		selectedValue = ''
	) => (
		<Modal visible={true} animationType='slide' transparent={true}>
			<View style={styles.modalContainer}>
				<View style={[styles.modalContent, { height: modalHeight }]}>
					{showSearch && (
						<View style={styles.modalSearchContainer}>
							<Search width={20} height={20} color='#888' />
							<TextInput
								style={styles.modalSearchInput}
								placeholder='Поиск марок...'
								placeholderTextColor='#aaa'
								value={brandSearchQuery}
								onChangeText={setBrandSearchQuery}
							/>
						</View>
					)}
					<ScrollView style={styles.modalScroll}>
						{data.length === 0 ? (
							<Text style={styles.noResultsText}>Ничего не найдено</Text>
						) : (
							data.map((item, index) => (
								<TouchableOpacity
									key={index}
									style={[
										styles.modalItem,
										selectedValue === item && styles.modalItemSelected,
									]}
									onPress={() => {
										onSelect(item);
										onClose();
										if (showSearch) setBrandSearchQuery('');
									}}
								>
									<Text
										style={[
											styles.modalItemText,
											selectedValue === item && styles.modalItemTextSelected,
										]}
									>
										{item}
									</Text>
								</TouchableOpacity>
							))
						)}
					</ScrollView>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={() => {
							onClose();
							if (showSearch) setBrandSearchQuery('');
						}}
					>
						<Text style={styles.closeButtonText}>Закрыть</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	const renderFilterModal = () => (
		<Modal visible={showFilterModal} animationType='slide' transparent={true}>
			<View style={styles.modalContainer}>
				<View style={[styles.modalContent, { height: modalHeight }]}>
					<Text style={styles.modalTitle}>Фильтры</Text>
					<ScrollView style={styles.modalScroll}>
						<Text style={styles.filterLabel}>Цена</Text>
						<View style={styles.priceInputs}>
							<TextInput
								style={[styles.priceInput, styles.priceInputHalf]}
								placeholder='Мин. цена'
								placeholderTextColor='#aaa'
								keyboardType='numeric'
								value={minPrice}
								onChangeText={text => setMinPrice(text.replace(/[^0-9]/g, ''))}
							/>
							<TextInput
								style={[styles.priceInput, styles.priceInputHalf]}
								placeholder='Макс. цена'
								placeholderTextColor='#aaa'
								keyboardType='numeric'
								value={maxPrice}
								onChangeText={text => setMaxPrice(text.replace(/[^0-9]/g, ''))}
							/>
						</View>
						<Text style={styles.filterLabel}>Год</Text>
						<TouchableOpacity
							style={styles.filterButton}
							onPress={() => setShowYearModal(true)}
						>
							<Text style={styles.filterText}>
								{selectedYear || 'Все года'}
							</Text>
							<ChevronDown width={16} height={16} color='#888' />
						</TouchableOpacity>
						<Text style={styles.filterLabel}>Статус</Text>
						<TouchableOpacity
							style={styles.filterButton}
							onPress={() => setShowStatusModal(true)}
						>
							<Text style={styles.filterText}>
								{selectedStatus || 'Все статусы'}
							</Text>
							<ChevronDown width={16} height={16} color='#888' />
						</TouchableOpacity>
						<Text style={styles.filterLabel}>Марка</Text>
						<TouchableOpacity
							style={styles.filterButton}
							onPress={() => setShowBrandModal(true)}
						>
							<Text
								style={styles.filterText}
								numberOfLines={1}
								ellipsizeMode='tail'
							>
								{selectedBrand || 'Все марки'}
							</Text>
							<ChevronDown width={16} height={16} color='#888' />
						</TouchableOpacity>
					</ScrollView>
					<View style={styles.modalButtons}>
						<TouchableOpacity
							style={[styles.modalButton, styles.resetButton]}
							onPress={() => {
								setSelectedBrand('');
								setSelectedYear('');
								setSelectedStatus('');
								setMinPrice('');
								setMaxPrice('');
								setBrandSearchQuery('');
							}}
						>
							<Text style={styles.modalButtonText}>Сбросить</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.modalButton, styles.applyButton]}
							onPress={() => setShowFilterModal(false)}
						>
							<Text style={styles.modalButtonText}>Применить</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Каталог автомобилей</Text>
			</View>
			<View style={styles.searchContainer}>
				<View style={styles.searchInputWrapper}>
					<Search width={20} height={20} color='#888' />
					<TextInput
						style={styles.searchInput}
						placeholder='Поиск автомобилей...'
						placeholderTextColor='#aaa'
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>
				<TouchableOpacity
					style={styles.filterIconButton}
					onPress={() => setShowFilterModal(true)}
				>
					<Filter width={24} height={24} color='#333' />
				</TouchableOpacity>
			</View>
			{cars.length === 0 ? (
				<Text style={styles.noResultsText}>Ничего не найдено</Text>
			) : (
				<FlatList
					data={cars}
					renderItem={renderCar}
					keyExtractor={item => item.id.toString()}
					contentContainerStyle={styles.carList}
				/>
			)}
			{showFilterModal && renderFilterModal()}
			{showBrandModal &&
				renderModal(
					filteredBrands,
					setSelectedBrand,
					() => setShowBrandModal(false),
					true,
					selectedBrand
				)}
			{showYearModal &&
				renderModal(
					years,
					setSelectedYear,
					() => setShowYearModal(false),
					false,
					selectedYear
				)}
			{showStatusModal &&
				renderModal(
					statuses,
					setSelectedStatus,
					() => setShowStatusModal(false),
					false,
					selectedStatus
				)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		paddingHorizontal: 16,
		paddingTop: 20,
	},
	header: {
		paddingVertical: 16,
		alignItems: 'center',
		borderBottomWidth: 0.5,
		borderBottomColor: '#ddd',
		marginBottom: 16,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1a1a1a',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	searchInputWrapper: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 12,
		paddingHorizontal: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		height: 48,
		color: '#1a1a1a',
		marginLeft: 8,
	},
	filterIconButton: {
		marginLeft: 12,
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	filterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginVertical: 8,
	},
	filterText: {
		flex: 1,
		fontSize: 16,
		color: '#1a1a1a',
	},
	carList: {
		paddingBottom: 20,
	},
	carCard: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 12,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 6,
		elevation: 3,
	},
	carImage: {
		width: '100%',
		height: 180,
		borderRadius: 12,
	},
	carPrice: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1a1a1a',
		marginTop: 12,
	},
	carModel: {
		fontSize: 18,
		fontWeight: '600',
		color: '#1a1a1a',
	},
	carYear: {
		fontSize: 14,
		color: '#666',
	},
	carDetails: {
		fontSize: 14,
		color: '#666',
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1a1a1a',
		marginBottom: 16,
	},
	modalScroll: {
		flex: 1,
	},
	modalSearchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
		borderRadius: 12,
		paddingHorizontal: 12,
		marginBottom: 16,
	},
	modalSearchInput: {
		flex: 1,
		fontSize: 16,
		height: 48,
		color: '#1a1a1a',
		marginLeft: 8,
	},
	modalItem: {
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#ddd',
	},
	modalItemSelected: {
		backgroundColor: '#e6f4ff',
	},
	modalItemText: {
		fontSize: 16,
		color: '#1a1a1a',
	},
	modalItemTextSelected: {
		fontWeight: '600',
		color: '#007BFF',
	},
	priceInputs: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginVertical: 8,
	},
	priceInput: {
		backgroundColor: '#f5f5f5',
		borderRadius: 12,
		paddingHorizontal: 12,
		height: 48,
		fontSize: 16,
		color: '#1a1a1a',
		width: '48%',
	},
	priceInputHalf: {
		marginHorizontal: 4,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 16,
	},
	modalButton: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
	},
	resetButton: {
		backgroundColor: '#f5f5f5',
		marginRight: 8,
	},
	applyButton: {
		backgroundColor: '#007BFF',
	},
	modalButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1a1a1a',
	},
	closeButton: {
		marginTop: 10,
		alignItems: 'center',
	},
	closeButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#007BFF',
	},
	favoriteIconContainer: {
		position: 'absolute',
		top: 16,
		right: 16,
	},
	carStatus: {
		fontSize: 14,
		fontWeight: '600',
		marginTop: 8,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 8,
		alignSelf: 'flex-start',
	},
	statusAvailable: {
		color: '#28a745',
		backgroundColor: '#e6f4e6',
	},
	statusReserved: {
		color: '#ffa500',
		backgroundColor: '#fff4e6',
	},
	statusLeased: {
		color: '#dc3545',
		backgroundColor: '#f8e6e6',
	},
	noResultsText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginTop: 20,
	},
});
