import { Alert, Platform } from 'react-native';

/**
 * Universal Alert Utility (Agent: Qwen)
 * Works on Native (Alert) and Web (window.confirm)
 */
export const uiAlert = (title, message, actions) => {
  if (Platform.OS === 'web') {
    // Basic web confirm polyfill
    const okAction = actions ? actions.find(a => a.style !== 'cancel') : null;
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed && okAction?.onPress) {
      okAction.onPress();
    }
  } else {
    // Native Alert
    Alert.alert(title, message, actions);
  }
};
