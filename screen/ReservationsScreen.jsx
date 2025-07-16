import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getHost } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReservationsScreen() {
	const [reservations, setReservations] = useState([]);
	const navigation = useNavigation();

	useEffect(() => {
		fetchReservations();
	}, []);

	const fetchReservations = async () => {
		try {
			const host = await getHost();
			
			const token = await AsyncStorage.getItem('token');
			const response = await fetch(`${host}/api/cars/reservations`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setReservations(data);
			} else {
				console.error('Ошибка загрузки бронирований:', await response.text());
			}
		} catch (error) {
			console.error('Ошибка загрузки бронирований:', error);
		}
	};

	const renderReservation = ({ item }) => (
		<TouchableOpacity
			style={styles.reservationCard}
			onPress={() =>
				navigation.replace('Main', {
					screen: 'CarDetails',
					params: { carId: item.carId },
				})
			}
		>
			<Text style={styles.carModel}>
				{item.carBrand} {item.carModel}
			</Text>
			<Text style={styles.reservationInfo}>
				Начало: {new Date(item.reservationStart).toLocaleDateString()}
			</Text>
			<Text style={styles.reservationInfo}>
				Окончание: {new Date(item.reservationEnd).toLocaleDateString()}
			</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Мои бронирования</Text>
			<FlatList
				data={reservations}
				renderItem={renderReservation}
				keyExtractor={item => item.id.toString()}
				contentContainerStyle={styles.reservationList}
				ListEmptyComponent={
					<Text style={styles.emptyText}>Активных бронирований нет.</Text>
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
	reservationList: {
		paddingBottom: 20,
	},
	reservationCard: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 15,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	carModel: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	reservationInfo: {
		fontSize: 16,
		color: '#555',
		marginTop: 5,
	},
	emptyText: {
		fontSize: 16,
		color: '#777',
		textAlign: 'center',
		marginTop: 20,
	},
});
