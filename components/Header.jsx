import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {
  User,
  Car,
  Heart,
  Calendar,
  Menu,
  X,
  LogOut,
  Home,
  Settings,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHost } from '../constants';

export default function Header() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
			try {
				const host = await getHost();

        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await fetch(`${host}/api/user/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            console.log('User data:', userData); // Для отладки
            setUserRole(userData.role || 'User');
            await AsyncStorage.setItem('userRole', userData.role || 'User');
          } else {
            console.error('Ошибка ответа API:', response.status);
            const storedRole = await AsyncStorage.getItem('userRole');
            if (storedRole) {
              setUserRole(storedRole);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при получении роли пользователя:', error);
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole);
        }
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userRole');
      setModalVisible(false);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const handleAdminNavigation = () => {
    console.log('Navigating to Admin, modalVisible:', modalVisible); // Для отладки
    setModalVisible(false); // Сбрасываем модалку
    setBurgerOpen(false);
    navigation.navigate('Admin');
  };

  return (
    <View style={styles.header}>
      {/* Логотип */}
      <TouchableOpacity
        style={styles.logoButton}
        onPress={() => {
          setModalVisible(false); // Сбрасываем модалку
          navigation.navigate('Main', { screen: 'Home' });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.logoContainer}>
          <Car width={24} height={24} color="#FFFFFF" />
          <Text style={styles.logoText}>RoyalWheels</Text>
        </View>
      </TouchableOpacity>

      {/* Бургер-меню справа */}
      <TouchableOpacity
        style={styles.burgerButton}
        onPress={() => setBurgerOpen(!burgerOpen)}
        activeOpacity={0.7}
      >
        {burgerOpen ? (
          <X size={24} color="#FFFFFF" />
        ) : (
          <Menu size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Боковое меню */}
      {burgerOpen && (
        <View style={styles.sideMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setModalVisible(false); // Сбрасываем модалку
              navigation.navigate('Main', { screen: 'Home' });
              setBurgerOpen(false);
            }}
          >
            <View style={styles.menuItemContent}>
              <Home width={20} height={20} color="#1A56DB" />
              <Text style={styles.menuText}>Главная</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setModalVisible(false); // Сбрасываем модалку
              navigation.navigate('Main', { screen: 'Favorites' });
              setBurgerOpen(false);
            }}
          >
            <View style={styles.menuItemContent}>
              <Heart width={20} height={20} color="#1A56DB" />
              <Text style={styles.menuText}>Избранное</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setModalVisible(false); // Сбрасываем модалку
              navigation.navigate('Main', { screen: 'Reservations' });
              setBurgerOpen(false);
            }}
          >
            <View style={styles.menuItemContent}>
              <Calendar width={20} height={20} color="#1A56DB" />
              <Text style={styles.menuText}>Мои бронирования</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setModalVisible(false); // Сбрасываем модалку
              navigation.navigate('Main', { screen: 'Profile' });
              setBurgerOpen(false);
            }}
          >
            <View style={styles.menuItemContent}>
              <User width={20} height={20} color="#1A56DB" />
              <Text style={styles.menuText}>Профиль</Text>
            </View>
          </TouchableOpacity>
          {userRole === 'Admin' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleAdminNavigation}
            >
              <View style={styles.menuItemContent}>
                <Settings width={20} height={20} color="#1A56DB" />
                <Text style={styles.menuText}>Админ-панель</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={() => {
              setModalVisible(true);
              setBurgerOpen(false);
            }}
          >
            <View style={styles.menuItemContent}>
              <LogOut width={20} height={20} color="#FF3B30" />
              <Text style={[styles.menuText, styles.logoutText]}>Выйти</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Модальное окно подтверждения выхода */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <LogOut size={24} color="#FF3B30" />
              <Text style={styles.modalTitle}>Выход из аккаунта</Text>
            </View>
            <Text style={styles.modalText}>Вы уверены, что хотите выйти?</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleLogout}
              >
                <Text style={styles.submitButtonText}>Выйти</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#1A56DB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    zIndex: 100,
  },
  burgerButton: {
    padding: 8,
  },
  sideMenu: {
    position: 'absolute',
    top: 60,
    right: '0',
    width: '70%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 99,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#1C2526',
    marginLeft: 12,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: '#FF3B30',
  },
  logoButton: {
    paddingVertical: 6,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C2526',
    marginLeft: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    marginLeft: 32,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF3B30',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});