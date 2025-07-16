import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screen/HomeScreen';
import LoginScreen from './screen/LoginScreen';
import RegisterScreen from './screen/RegisterScreen';
import PolicyScreen from './screen/PolicyScreen';
import CarDetailsScreen from './screen/CarDetailsScreen';
import PaymentScreen from './screen/PaymentScreen';
import ProfileScreen from './screen/ProfileScreen';
import FavoritesScreen from './screen/FavoritesScreen';
import ReservationsScreen from './screen/ReservationsScreen';
import CreateReviewScreen from './screen/CreateReviewScreen';
import AdminScreen from './screen/AdminScreen';
import Header from './components/Header';
import { host } from './constants';

const Stack = createStackNavigator();

class ErrorBoundary extends React.Component {
	state = { hasError: false };
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	render() {
		if (this.state.hasError) {
			return (
				<View
					style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
				>
					<Text>Произошла ошибка. Перезагрузите приложение.</Text>
				</View>
			);
		}
		return this.props.children;
	}
}

function MainNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name='Home' component={HomeScreen} />
			<Stack.Screen name='CarDetails' component={CarDetailsScreen} />
			<Stack.Screen name='Payment' component={PaymentScreen} />
			<Stack.Screen name='Profile' component={ProfileScreen} />
			<Stack.Screen name='Favorites' component={FavoritesScreen} />
			<Stack.Screen name='Reservations' component={ReservationsScreen} />
			<Stack.Screen name='CreateReview' component={CreateReviewScreen} />
		</Stack.Navigator>
	);
}

function MainScreen() {
	return (
		<>
			<Header />
			<MainNavigator />
		</>
	);
}

export default function App() {
	return (
		<ErrorBoundary>
			<NavigationContainer>
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name='Login' component={LoginScreen} />
					<Stack.Screen name='Register' component={RegisterScreen} />
					<Stack.Screen name='Policy' component={PolicyScreen} />
					<Stack.Screen name='Main' component={MainScreen} />
					<Stack.Screen
						name='Admin'
						component={AdminScreen}
						options={{ cardStyle: { flex: 1 } }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</ErrorBoundary>
	);
}
