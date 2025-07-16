import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Dimensions,
} from 'react-native';
import { getHost } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Star, ArrowLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CreateReviewScreen({ route, navigation }) {
	const { carId } = route.params;
	const [rating, setRating] = useState(3);
	const [comment, setComment] = useState('');
	const handleSubmitReview = async () => {

		if (!comment.trim()) {
			Alert.alert('Ошибка', 'Пожалуйста, напишите отзыв.');
			return;
		}

		try {
			const host = await getHost();
			
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт.');
				navigation.navigate('Login');
				return;
			}

			const response = await fetch(`${host}/api/cars/${carId}/review`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ rating, comment }),
			});

			if (response.ok) {
				Alert.alert('Успех', 'Отзыв успешно добавлен!');
				navigation.goBack();
			} else {
				const errorText = await response.text();
				if (errorText === 'Вы уже оставили отзыв для этого автомобиля.') {
					Alert.alert('Ошибка', 'Вы уже оставили отзыв для этого автомобиля.');
				} else {
					Alert.alert('Ошибка', errorText || 'Не удалось отправить отзыв.');
				}
			}
		} catch (error) {
			Alert.alert('Ошибка', 'Не удалось подключиться к серверу');
		}
	};

	const renderStars = () => {
		const stars = [];
		for (let i = 1; i <= 5; i++) {
			stars.push(
				<TouchableOpacity
					key={i}
					onPress={() => setRating(i)}
					style={styles.starButton}
				>
					<Star
						width={28}
						height={28}
						color={i <= rating ? '#FFD700' : '#E5E5EA'}
						fill={i <= rating ? '#FFD700' : 'none'}
						strokeWidth={1.5}
					/>
				</TouchableOpacity>
			);
		}
		return stars;
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<ArrowLeft width={24} height={24} color='#1C2526' />
				</TouchableOpacity>
				<Text style={styles.title}>Написать отзыв</Text>
			</View>
			<View style={styles.ratingContainer}>
				<Text style={styles.label}>Рейтинг: {rating}</Text>
				<View style={styles.starsContainer}>{renderStars()}</View>
			</View>
			<Text style={styles.label}>Ваш отзыв</Text>
			<TextInput
				style={styles.input}
				placeholder='Поделитесь впечатлениями об автомобиле'
				placeholderTextColor='#8E8E93'
				value={comment}
				onChangeText={setComment}
				multiline
				numberOfLines={6}
				maxLength={500}
			/>
			<Text style={styles.charCount}>{comment.length}/500</Text>
			<TouchableOpacity
				style={[styles.submitButton, !comment.trim() && styles.disabledButton]}
				onPress={handleSubmitReview}
				disabled={!comment.trim()}
			>
				<Text style={styles.submitButtonText}>Отправить отзыв</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F7F7FC',
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	backButton: {
		padding: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1C2526',
		flex: 1,
		textAlign: 'center',
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: '#8E8E93',
		marginBottom: 8,
	},
	ratingContainer: {
		marginBottom: 24,
	},
	starsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
	},
	starButton: {
		padding: 4,
	},
	input: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		color: '#1C2526',
		textAlignVertical: 'top',
		height: 120,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},
	charCount: {
		fontSize: 12,
		color: '#8E8E93',
		textAlign: 'right',
		marginTop: 8,
		marginBottom: 20,
	},
	submitButton: {
		backgroundColor: '#007BFF',
		borderRadius: 10,
		paddingVertical: 16,
		alignItems: 'center',
		shadowColor: '#007BFF',
		shadowOpacity: 0.2,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	disabledButton: {
		backgroundColor: '#C7C7CC',
		shadowOpacity: 0,
	},
	submitButtonText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#fff',
	},
});
