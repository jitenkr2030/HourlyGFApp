import 'react-native-gesture-handler'; // Import this to enable gesture handling
import { AppRegistry } from 'react-native'; // Import AppRegistry
import App from './App'; // Import the main App component
import { name as appName } from './app.json'; // Import the app name from app.json

// Register the main component with AppRegistry
AppRegistry.registerComponent(appName, () => App);
