import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Dimensions,
	Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHost } from '../constants';
import { Star, Heart, Calendar, FileText } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');
const MAX_WIDTH = Platform.OS === 'web' ? Math.min(width, 600) : width;

const CustomSlider = ({ value, onChange, min, max, step }) => {
	return (
		<View style={styles.sliderContainer}>
			<Slider
				value={value}
				onValueChange={onChange}
				minimumValue={min}
				maximumValue={max}
				step={step}
				minimumTrackTintColor={Platform.OS === 'ios' ? '#007AFF' : '#FF2D55'}
				maximumTrackTintColor={Platform.OS === 'ios' ? '#E5E5EA' : '#E5E5EA'}
				thumbTintColor={Platform.OS === 'ios' ? '#007AFF' : '#FF2D55'}
				style={Platform.OS === 'ios' ? styles.sliderIOS : styles.slider}
			/>
			{Platform.OS === 'ios' && (
				<View style={styles.sliderLabels}>
					<Text style={styles.sliderLabelText}>{min}</Text>
					<Text style={styles.sliderLabelText}>{max}</Text>
				</View>
			)}
		</View>
	);
};

export default function CarDetailsScreen({ route, navigation }) {
	const { carId } = route.params || {};
	const [carData, setCarData] = useState(null);
	const [downPayment, setDownPayment] = useState(20);
	const [leaseTerm, setLeaseTerm] = useState(36);
	const [reviews, setReviews] = useState([]);
	const [isFavorite, setIsFavorite] = useState(false);
	const [isLeased, setIsLeased] = useState(false);
	const [loading, setLoading] = useState(true);

	const statusToDisplayMap = {
		Available: 'Доступен',
		Reserved: 'Забронирован',
		Leased: 'В лизинге',
	};

	useEffect(() => {
		if (!carId) {
			console.error('carId не предоставлен');
			setLoading(false);
			return;
		}

		setCarData(null);
		setReviews([]);
		setIsFavorite(false);
		setIsLeased(false);
		setLoading(true);

		fetchCarDetails();
		fetchReviews();
		checkFavoriteStatus();

		const unsubscribe = navigation.addListener('focus', () => {
			const currentCarId = route.params?.carId;
			if (currentCarId && currentCarId !== carId) {
				setCarData(null);
				setReviews([]);
				setIsFavorite(false);
				setIsLeased(false);
				setLoading(true);
				fetchCarDetails();
				fetchReviews();
				checkFavoriteStatus();
			}
		});

		return unsubscribe;
	}, [carId, navigation, route.params]);

	const fetchCarDetails = async () => {
		try {
			const host = await getHost();
			const token = await AsyncStorage.getItem('token');
			const response = await fetch(`${host}/api/cars/${carId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setCarData(data);
				setIsLeased(data.status === 'Leased');
			} else {
				console.log('Ошибка загрузки данных машины:', await response.text());
			}
		} catch (error) {
			console.log('Ошибка подключения:', error.message);
		} finally {
			setLoading(false);
		}
	};

	const fetchReviews = async () => {
		try {
			const host = await getHost();
			const response = await fetch(`${host}/api/cars/${carId}/reviews`);
			const data = await response.json();
			setReviews(data);
		} catch (error) {
			console.error('Ошибка загрузки отзывов:', error);
		}
	};

	const checkFavoriteStatus = async () => {
		try {
			const host = await getHost();
			const token = await AsyncStorage.getItem('token');
			if (!token) return;
			const response = await fetch(`${host}/api/cars/favorites`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const favorites = await response.json();
			const isFav = favorites.some(fav => fav.id === carId);
			setIsFavorite(isFav);
		} catch (error) {
			console.error('Ошибка проверки статуса избранного:', error);
		}
	};

	const handleReserve = async () => {
		try {
			const host = await getHost();
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				console.log('Токен не найден');
				navigation.navigate('Login');
				return;
			}
			const reservationStart = new Date();
			const reservationEnd = new Date();
			reservationEnd.setDate(reservationStart.getDate() + 1);
			const response = await fetch(`${host}/api/cars/reserve`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					carId,
					reservationStart: reservationStart.toISOString(),
					reservationEnd: reservationEnd.toISOString(),
				}),
			});
			if (response.ok) {
				console.log('Автомобиль забронирован');
				fetchCarDetails();
			} else {
				console.log('Ошибка бронирования:', await response.text());
			}
		} catch (error) {
			console.log('Ошибка подключения:', error.message);
		}
	};

	const handleToggleFavorite = async () => {
		try {
			const host = await getHost();
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				console.log('Токен не найден');
				navigation.navigate('Login');
				return;
			}
			const method = isFavorite ? 'DELETE' : 'POST';
			const response = await fetch(`${host}/api/cars/favorites/${carId}`, {
				method,
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				setIsFavorite(!isFavorite);
				console.log(
					isFavorite
						? 'Автомобиль удалён из избранного'
						: 'Автомобиль добавлен в избранное'
				);
			} else {
				console.log('Ошибка:', await response.text());
			}
		} catch (error) {
			console.log('Ошибка подключения:', error.message);
		}
	};

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size='large' color='#007BFF' />
			</View>
		);
	}

	if (!carData) {
		return (
			<View style={styles.container}>
				<Text style={styles.noDataText}>
					Не удалось загрузить данные машины.
				</Text>
			</View>
		);
	}

	const monthlyPayment = (carData.price * (1 - downPayment / 100)) / leaseTerm;

	const getStatusStyle = status => {
		switch (status) {
			case 'Available':
				return styles.statusAvailable;
			case 'Reserved':
				return styles.statusReserved;
			case 'Leased':
				return styles.statusLeased;
			default:
				return styles.statusDefault;
		}
	};

	return (
		<ScrollView
			style={styles.container}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ alignItems: 'center' }}
		>
			<View style={styles.imageContainer}>
				<Image source={{ uri: carData.photoUrl }} style={styles.carImage} />
				<TouchableOpacity
					style={styles.favoriteButton}
					onPress={handleToggleFavorite}
				>
					<Heart
						width={24}
						height={24}
						color={isFavorite ? '#FF3B30' : '#fff'}
						fill={isFavorite ? '#FF3B30' : 'none'}
						strokeWidth={2}
					/>
				</TouchableOpacity>
			</View>

			<View style={styles.infoContainer}>
				<Text style={styles.carTitle}>
					{carData.brand} {carData.model}
				</Text>
				<View style={styles.ratingContainer}>
					<Star width={16} height={16} color='#FFD700' fill='#FFD700' />
					<Text style={styles.carRating}>
						{carData.averageRating.toFixed(1)} / 5
					</Text>
				</View>
				<Text style={styles.carPrice}>₸{carData.price.toLocaleString()}</Text>
			</View>

			<View style={styles.detailsContainer}>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Двигатель:</Text>
					<Text style={styles.detailValue}>{carData.engine}</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Тип кузова:</Text>
					<Text style={styles.detailValue}>{carData.bodyType}</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Год выпуска:</Text>
					<Text style={styles.detailValue}>{carData.year}</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Статус:</Text>
					<Text style={[styles.detailValue, getStatusStyle(carData.status)]}>
						{statusToDisplayMap[carData.status] || carData.status}
					</Text>
				</View>
			</View>

			<View style={styles.actionsContainer}>
				<TouchableOpacity
					style={[
						styles.actionButton,
						carData.status !== 'Available' && styles.disabledButton,
					]}
					onPress={handleReserve}
					disabled={carData.status !== 'Available'}
				>
					<Calendar
						width={20}
						height={20}
						color='#fff'
						style={styles.buttonIcon}
					/>
					<Text style={styles.actionButtonText}>Забронировать</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.actionButton}
					onPress={() =>
						navigation.navigate('Main', {
							screen: 'CreateReview',
							params: { carId },
						})
					}
				>
					<FileText
						width={20}
						height={20}
						color='#fff'
						style={styles.buttonIcon}
					/>
					<Text style={styles.actionButtonText}>Написать отзыв</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.calculatorContainer}>
				<Text style={styles.sectionTitle}>Калькулятор лизинга</Text>
				<View style={styles.sliderContainer}>
					<View style={styles.sliderHeader}>
						<Text style={styles.sliderLabel}>Первоначальный взнос</Text>
						<Text style={styles.sliderValue}>
							{downPayment}% (₸
							{(carData.price * (downPayment / 100)).toLocaleString()})
						</Text>
					</View>
					<CustomSlider
						value={downPayment}
						onChange={setDownPayment}
						min={10}
						max={50}
						step={1}
					/>
				</View>
				<View style={styles.sliderContainer}>
					<View style={styles.sliderHeader}>
						<Text style={styles.sliderLabel}>Срок лизинга</Text>
						<Text style={styles.sliderValue}>{leaseTerm} мес.</Text>
					</View>
					<CustomSlider
						value={leaseTerm}
						onChange={setLeaseTerm}
						min={12}
						max={60}
						step={12}
					/>
				</View>
				<View style={styles.paymentContainer}>
					<Text style={styles.paymentLabel}>Ежемесячный платёж:</Text>
					<Text style={styles.paymentValue}>
						₸{monthlyPayment.toLocaleString()}
					</Text>
				</View>
				<TouchableOpacity
					style={[styles.actionButton, isLeased ? styles.disabledButton : null]}
					onPress={() =>
						navigation.navigate('Main', {
							screen: 'Payment',
							params: {
								leaseDetails: {
									monthlyPayment: monthlyPayment.toFixed(2),
									downPayment: (carData.price * (downPayment / 100)).toFixed(2),
									leaseTerm,
									carId,
									carBrand: carData.brand,
									carModel: carData.model,
									status: carData.status,
								},
							},
						})
					}
					disabled={isLeased}
				>
					<Text style={styles.actionButtonText}>
						{isLeased ? 'В лизинге' : 'Оформить лизинг'}
					</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.reviewsContainer}>
				<Text style={styles.sectionTitle}>Отзывы ({reviews.length})</Text>
				{reviews.length > 0 ? (
					reviews.map(review => (
						<View key={review.id} style={styles.reviewCard}>
							<View style={styles.reviewHeader}>
								<Text style={styles.reviewUser}>{review.userName}</Text>
								<View style={styles.reviewRating}>
									<Star width={16} height={16} color='#FFD700' fill='#FFD700' />
									<Text style={styles.reviewRatingText}>{review.rating}</Text>
								</View>
							</View>
							<Text style={styles.reviewComment}>{review.comment}</Text>
							<Text style={styles.reviewDate}>
								{new Date(review.createdAt).toLocaleDateString()}
							</Text>
						</View>
					))
				) : (
					<Text style={styles.noReviews}>Отзывов пока нет.</Text>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F7F7FC',
		paddingTop: 16,
		width: '100%',
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F7F7FC',
	},
	noDataText: {
		fontSize: 16,
		color: '#8E8E93',
		textAlign: 'center',
		marginTop: 20,
	},
	imageContainer: {
		position: 'relative',
		marginBottom: 20,
		paddingHorizontal: 16,
		width: '100%',
		maxWidth: MAX_WIDTH,
		alignSelf: 'center',
	},
	carImage: {
		width: '100%',
		height: 200,
		borderRadius: 12,
		resizeMode: 'cover',
	},
	favoriteButton: {
		position: 'absolute',
		top: 16,
		right: 32,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 20,
		padding: 8,
	},
	sliderLabels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 4,
	},
	sliderLabelText: {
		fontSize: 12,
		color: '#8E8E93',
	},
	infoContainer: {
		paddingHorizontal: 16,
		marginBottom: 20,
		width: '100%',
		maxWidth: MAX_WIDTH,
		alignSelf: 'center',
	},
	carTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1C2526',
		marginBottom: 8,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	carRating: {
		fontSize: 16,
		color: '#8E8E93',
		marginLeft: 6,
	},
	carPrice: {
		fontSize: 20,
		fontWeight: '600',
		color: '#007BFF',
	},
	detailsContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginHorizontal: 16,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
		width: '100%',
		maxWidth: MAX_WIDTH,
		alignSelf: 'center',
	},
	detailRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
		paddingHorizontal: 4,
	},
	detailLabel: {
		fontSize: 16,
		color: '#8E8E93',
		flex: 1,
	},
	detailValue: {
		fontSize: 16,
		fontWeight: '500',
		color: '#1C2526',
		flex: 1,
		textAlign: 'right',
	},
	statusAvailable: { color: '#34C759', fontWeight: '600' },
	statusReserved: { color: '#FF9500', fontWeight: '600' },
	statusLeased: { color: '#FF3B30', fontWeight: '600' },
	statusDefault: { color: '#1C2526', fontWeight: '500' },
	actionsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginBottom: 20,
		gap: 16,
		width: '100%',
		maxWidth: MAX_WIDTH,
		alignSelf: 'center',
		justifyContent: 'space-between',
	},
	actionButton: {
		backgroundColor: '#007BFF',
		borderRadius: 10,
		paddingVertical: 14,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'center',
		shadowColor: '#007BFF',
		shadowOpacity: 0.2,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		flex: 1,
	},
	disabledButton: {
		backgroundColor: '#C7C7CC',
		shadowOpacity: 0,
	},
	buttonIcon: {
		marginRight: 8,
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#fff',
	},
	calculatorContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginHorizontal: 16,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
		width: '100%',
		maxWidth: MAX_WIDTH,
		alignSelf: 'center',
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1C2526',
		marginBottom: 12,
	},
	sliderContainer: {
		marginBottom: 16,
		width: '100%',
	},
	slider: {
		width: '100%',
		height: 40,
	},
	sliderIOS: {
		width: '100%',
		height: 40,
	},
	sliderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	sliderLabel: {
		fontSize: 16,
	},
	sliderValue: {
		fontSize: 16,
		fontWeight: '500',
		color: '#007BFF',
	},
	paymentContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
		paddingVertical: 12,
		backgroundColor: '#F7F7FC',
		borderRadius: 8,
		paddingHorizontal: 16,
	},
	paymentLabel: {
		fontSize: 18,
		fontWeight: '600',
		color: '#1C2526',
	},
	paymentValue: {
		fontSize: 18,
		fontWeight: '700',
		color: '#007BFF',
	},
	reviewsContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginHorizontal: 16,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
		width: '100%',
		maxWidth: MAX_WIDTH,
		alignSelf: 'center',
	},
	reviewCard: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5EA',
		marginBottom: 12,
	},
	reviewHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	reviewUser: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1C2526',
	},
	reviewRating: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	reviewRatingText: {
		fontSize: 14,
		color: '#8E8E93',
		marginLeft: 4,
	},
	reviewComment: {
		fontSize: 14,
		color: '#1C2526',
		lineHeight: 20,
		marginBottom: 8,
	},
	reviewDate: {
		fontSize: 12,
		color: '#8E8E93',
	},
	noReviews: {
		fontSize: 16,
		color: '#8E8E93',
		textAlign: 'center',
		marginVertical: 20,
	},
});
