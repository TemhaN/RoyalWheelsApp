import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Image,
	Alert,
} from 'react-native';
import { getHost } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function FavoritesScreen() {
	const navigation = useNavigation();
	const [favorites, setFavorites] = useState([]);

	useEffect(() => {
		fetchFavorites();
	}, []);

	const fetchFavorites = async () => {
		try {
			const host = await getHost();
			
			const token = await AsyncStorage.getItem('token');
			const response = await fetch(`${host}/api/cars/favorites`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setFavorites(data);
			} else {
				Alert.alert('Ошибка', 'Не удалось загрузить избранное.');
			}
		} catch (error) {
			Alert.alert('Ошибка', 'Не удалось подключиться к серверу');
		}
	};

	const handleRemoveFromFavorites = async carId => {
		try {
			const host = await getHost();
			
			const token = await AsyncStorage.getItem('token');
			const response = await fetch(`${host}/api/cars/favorites/${carId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				setFavorites(favorites.filter(car => car.id !== carId));
				Alert.alert('Успех', 'Автомобиль удалён из избранного.');
			} else {
				const error = await response.text();
				Alert.alert('Ошибка', error);
			}
		} catch (error) {
			Alert.alert('Ошибка', 'Не удалось подключиться к серверу');
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
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.removeButton}
				onPress={() => handleRemoveFromFavorites(item.id)}
			>
				<Text style={styles.removeButtonText}>Удалить</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Избранное</Text>
			<FlatList
				data={favorites}
				renderItem={renderCar}
				keyExtractor={item => item.id.toString()}
				contentContainerStyle={styles.carList}
				ListEmptyComponent={
					<Text style={styles.emptyText}>Избранных автомобилей нет.</Text>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f9f9f9',
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#333',
	},
	carList: {
		paddingBottom: 20,
	},
	carCard: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 10,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	carImage: {
		width: '100%',
		height: 150,
		borderRadius: 10,
	},
	carPrice: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginTop: 10,
	},
	carModel: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
	},
	carYear: {
		fontSize: 14,
		color: '#777',
	},
	carDetails: {
		fontSize: 14,
		color: '#777',
	},
	removeButton: {
		backgroundColor: '#dc3545',
		borderRadius: 8,
		paddingVertical: 10,
		alignItems: 'center',
		marginTop: 10,
	},
	removeButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	emptyText: {
		fontSize: 16,
		color: '#777',
		textAlign: 'center',
		marginTop: 20,
	},
});
