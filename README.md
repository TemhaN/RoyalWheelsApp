# 🚗 RoyalWheels App

**RoyalWheels** — мобильное приложение на **React Native** для аренды и лизинга автомобилей.  
Позволяет искать, бронировать и добавлять в избранное автомобили, оставлять отзывы, управлять профилем и бронированиями.  
Реализована админ-панель для управления пользователями, автомобилями, лизинговыми договорами, платежами, бронированиями и отзывами.  
Использует современный интерфейс с адаптивным дизайном, анимациями и авторизацией через JWT.

## ✨ Возможности

- 🔐 **Аутентификация**: регистрация, вход, выход, управление профилем.
- 🚘 **Управление автомобилями**: просмотр, бронирование, добавление в избранное, фильтрация (по марке, году, цене, статусу).
- 📝 **Отзывы**: добавление, просмотр, удаление отзывов с рейтингом (звёзды).
- ⭐ **Избранное**: добавление и удаление автомобилей.
- 📅 **Брони и лизинг**: оформление бронирований, калькулятор лизинга, история бронирований.
- 🛠️ **Админ-панель**: управление пользователями, автомобилями, договорами, платежами, бронированиями и отзывами.
- 🎨 **Современный интерфейс**: адаптивный дизайн, анимации, закруглённые элементы, бургер-меню.

## 📋 Требования

- [Node.js 16+](https://nodejs.org/)
- React Native CLI
- Expo CLI *(опционально, если используешь Expo)*
- Android Studio или Xcode (для эмуляторов)
- Любой браузер (для веб-версии)
- Доступ к серверу RoyalWheels API


## 🧩 Зависимости

| Библиотека / Технология             | Назначение                                |
|-------------------------------------|-------------------------------------------|
| `React Native`                      | Фреймворк для мобильного приложения       |
| `React Navigation`                  | Навигация по экранам                      |
| `AsyncStorage`                      | Локальное хранилище данных                |
| `lucide-react-native`               | Иконки интерфейса                         |
| `react-native-reanimated`           | Анимации компонентов                      |
| `axios` или `fetch`                 | HTTP-запросы к API                        |

Полный список — смотри в `package.json`.

## 🚀 Установка и запуск

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/YourUsername/RoyalWheels.git
   cd RoyalWheels

2. **Установите зависимости**

   ```bash
   npm install
   ```

3. **Создайте файл конфигурации**
   В корне проекта создайте файл `constants.js`:

   ```javascript
   export const getHost = async () => {
     return 'https://your-api-host.com';
   };
   ```

   ⚠️ Укажи актуальный URL API сервера.

4. **Запустите приложение**

   **Android:**

   ```bash
   npx react-native run-android
   ```

   **iOS:**

   ```bash
   npx react-native run-ios
   ```

   **Веб-версия:**

   ```bash
   npm run web
   ```

5. **Релизная сборка**

   ```bash
   # Android
   npx react-native build-android

   # iOS
   npx react-native build-ios
   ```

   Сборка будет в:

   * Android: `android/app/build/outputs`
   * iOS: `ios/build`

## 🖱️ Использование

1. Запусти приложение:

   ```bash
   npx react-native run-android
   ```

   или

   ```bash
   npx react-native run-ios
   ```

2. Открой в эмуляторе или устройстве.

3. **Аутентификация:**

   * **Login экран** — вход
   * **Register экран** — регистрация

4. **Работа с автомобилями:**

   * Главная (`Home`) — список машин
   * Детали авто (`CarDetails`) — бронирование, избранное, отзывы

5. **Профиль:**

   * Управление профилем и бронированиями (`Profile`, `Reservations`)

6. **Админ-доступ:**

   * `/Admin` — управление пользователями, автомобилями, договорами, платежами и отзывами

## 📦 Сборка приложения

**Релизная сборка Android**

```bash
npx react-native build-android --mode release
```

**Релизная сборка iOS**

```bash
npx react-native build-ios --mode Release
```

**Развёртывание:**

* Скопируй APK или IPA на устройство.
* Для веб-версии:

  ```bash
  npm run build
  ```

Убедись, что API-сервер доступен.

## 📸 Скриншоты

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/1.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/2.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/3.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/4.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/5.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/6.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/7.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/8.png?raw=true" alt="Service App" width="30%">
  <img src="https://github.com/TemhaN/RoyalWheelsApp/blob/main/Screenshots/9.png?raw=true" alt="Service App" width="30%">
</div>    

## 🧠 Автор

**TemhaN**  
[GitHub профиль](https://github.com/TemhaN)

## 🧾 Лицензия

Проект распространяется под лицензией [MIT License].

## 📬 Обратная связь

Нашли баг или хотите предложить улучшение?
Создайте **issue** или присылайте **pull request** в репозиторий!

## ⚙️ Технологии

* **React Native** — разработка мобильного приложения
* **React Navigation** — навигация по экранам
* **AsyncStorage** — локальное хранилище токенов и данных
* **lucide-react-native** — иконки
* **react-native-reanimated** — анимации
* **JWT** — аутентификация через токены
* **Fetch API** — взаимодействие с сервером
