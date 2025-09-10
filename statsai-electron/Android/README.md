# Android Mobile Development - StatsAI Electron

## Overview
This folder contains the Android mobile implementation of the StatsAI Electron applications, featuring Material Design 3 (Material You) components and optimized for the Android ecosystem.

## Tech Stack
- **React Native** with TypeScript
- **Material Design 3** (Material You)
- **NativeWind** (Tailwind CSS for React Native)
- **shadcn/ui components** adapted with Material Design
- **Expo** for development and deployment
- **Android Emulator** for testing

## Quick Setup

### Prerequisites
```bash
# Install Node.js dependencies
npm install -g @expo/cli
npm install -g react-native-cli

# Install Android development tools
# Install Android Studio and SDK
# Set ANDROID_HOME environment variable
```

### Project Initialization
```bash
# Create new Expo project with TypeScript
npx create-expo-app --template blank-typescript

# Install Material Design and NativeWind
npm install react-native-paper
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Install navigation and Material components
npm install @react-navigation/native @react-navigation/material-bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-vector-icons
```

### Material Design Configuration
```bash
# Install Material Design components
npm install react-native-paper
npm install @react-native-material/core

# Configure Material You theming
npm install @react-native-async-storage/async-storage
npm install react-native-dynamic-color
```

## Architecture

### Directory Structure
```
Android/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn + Material Design components
│   │   ├── email/           # Email assistant components
│   │   ├── search/          # AI search components
│   │   └── material/        # Material Design 3 components
│   ├── screens/
│   │   ├── EmailScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── DashboardScreen.tsx
│   ├── navigation/
│   │   └── MaterialNavigator.tsx
│   ├── services/
│   │   ├── emailService.ts
│   │   ├── searchService.ts
│   │   └── assistantService.ts
│   ├── hooks/
│   │   ├── useVoiceCommand.ts
│   │   └── useMaterialTheme.ts
│   ├── theme/
│   │   ├── materialTheme.ts
│   │   └── dynamicColors.ts
│   └── styles/
│       └── tailwind.config.js
├── android/
├── assets/
├── app.json
├── package.json
└── components.json
```

## Material Design 3 Implementation

### Dynamic Color System (Material You)
```typescript
// Material You dynamic theming
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';

export const useDynamicTheme = () => {
  const { theme } = useMaterial3Theme();
  
  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      secondary: theme.colors.secondary,
      onSecondary: theme.colors.onSecondary,
      surface: theme.colors.surface,
      onSurface: theme.colors.onSurface,
    },
  };
  
  return { paperTheme, theme };
};
```

### Material Components Integration
```typescript
// Material Design Card with elevation
import { Card, Title, Paragraph } from 'react-native-paper';

const MaterialCard = ({ title, content, elevation = 2 }) => (
  <Card style={{ margin: 16, elevation }}>
    <Card.Content>
      <Title>{title}</Title>
      <Paragraph>{content}</Paragraph>
    </Card.Content>
  </Card>
);

// Floating Action Button
const MaterialFAB = ({ onPress, icon = "plus" }) => (
  <FAB
    style={{
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    }}
    icon={icon}
    onPress={onPress}
  />
);
```

### Voice Integration (Google Assistant)
```typescript
// Google Assistant integration
import { Voice } from '@react-native-voice/voice';

class AndroidVoiceService {
  constructor() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
  }

  async startListening() {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Voice start error:', error);
    }
  }

  async stopListening() {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  }

  processVoiceCommand(results: string[]) {
    const command = results[0].toLowerCase();
    const actions = {
      'search emails': () => navigateToEmailSearch(),
      'compose email': () => openEmailComposer(),
      'show dashboard': () => navigateToDashboard(),
      'open settings': () => navigateToSettings(),
    };
    
    return actions[command]?.();
  }
}
```

### Android-Specific Features
```typescript
// Navigation with Material Bottom Tabs
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createMaterialBottomTabNavigator();

const MaterialBottomTabs = () => (
  <Tab.Navigator
    initialRouteName="Dashboard"
    activeColor="#e91e63"
    barStyle={{ backgroundColor: '#694fad' }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Analytics',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="chart-line" color={color} size={26} />
        ),
      }}
    />
    <Tab.Screen
      name="Email"
      component={EmailScreen}
      options={{
        tabBarLabel: 'Email',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="email" color={color} size={26} />
        ),
      }}
    />
    <Tab.Screen
      name="Search"
      component={SearchScreen}
      options={{
        tabBarLabel: 'Search',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="magnify" color={color} size={26} />
        ),
      }}
    />
  </Tab.Navigator>
);
```

## Development Workflow

### Running in Emulator
```bash
# Start Metro bundler
npx react-native start

# Run on Android emulator
npx react-native run-android

# Run on specific device
npx react-native run-android --deviceId="device_id"

# Start Expo development server
npx expo start --android
```

### Building for Device Testing
```bash
# Create development build
eas build --platform android --profile development

# Create AAB for Play Store testing
eas build --platform android --profile preview

# Submit to Google Play Store
eas submit --platform android
```

### Testing Strategy
```bash
# Unit tests with Jest
npm test

# E2E tests with Detox
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug

# UI tests with Maestro
maestro test flows/
```

## Component Library Integration

### Material Design + shadcn Hybrid
```typescript
// Material-styled Button with shadcn consistency
import { Button as PaperButton } from 'react-native-paper';
import { cn } from '../lib/utils';

const MaterialButton = ({ 
  variant = 'contained', 
  className, 
  children, 
  ...props 
}) => {
  const buttonStyles = {
    contained: 'bg-primary text-primary-foreground',
    outlined: 'border border-outline text-primary',
    text: 'text-primary',
  };

  return (
    <PaperButton
      mode={variant}
      className={cn(buttonStyles[variant], 'min-h-[48dp]', className)}
      {...props}
    >
      {children}
    </PaperButton>
  );
};
```

### Voice-Enabled Components
```typescript
// Material Search Bar with voice input
const MaterialVoiceSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const voiceService = new AndroidVoiceService();

  const toggleVoiceSearch = async () => {
    if (isListening) {
      await voiceService.stopListening();
    } else {
      await voiceService.startListening();
    }
    setIsListening(!isListening);
  };

  return (
    <Searchbar
      placeholder="Search or speak..."
      onChangeText={setSearchQuery}
      value={searchQuery}
      style={{ margin: 16 }}
      right={(props) => (
        <IconButton
          {...props}
          icon={isListening ? "microphone" : "microphone-outline"}
          iconColor={isListening ? "#e91e63" : undefined}
          onPress={toggleVoiceSearch}
        />
      )}
    />
  );
};
```

## Email Assistant Android Features
- Material Design email cards with elevation
- Swipe-to-action with Material ripple effects
- Voice-to-text with Google's speech recognition
- Smart categorization with Material You colors
- Adaptive layout for different screen sizes
- Integration with Android notification system

## AI Search Android Features
- Material Search component with suggestions
- Voice search with real-time transcription
- Result cards with Material Design elevation
- Gesture navigation with Android back button support
- Integration with Android's share system
- Adaptive icons and splash screens

## Performance Optimization
- Hermes JavaScript engine for faster startup
- ProGuard/R8 code shrinking and obfuscation
- Native module optimization
- Image caching with Glide integration
- Background task optimization with WorkManager
- Memory leak prevention with LeakCanary

## Deployment Pipeline

### Development
```bash
# Debug build with hot reload
npx expo start --dev-client --android

# Install on connected device
adb install app-debug.apk
```

### Staging
```bash
# Release build for internal testing
./gradlew assembleRelease

# Upload to Play Console internal testing
eas submit --platform android --track internal
```

### Production
```bash
# Production AAB build
eas build --platform android --profile production

# Submit to Google Play Store
eas submit --platform android --auto
```

## Material Design Guidelines Compliance

### Typography Scale
```typescript
// Material Design 3 Typography
const MaterialTypography = {
  displayLarge: { fontSize: 57, lineHeight: 64 },
  displayMedium: { fontSize: 45, lineHeight: 52 },
  displaySmall: { fontSize: 36, lineHeight: 44 },
  headlineLarge: { fontSize: 32, lineHeight: 40 },
  headlineMedium: { fontSize: 28, lineHeight: 36 },
  headlineSmall: { fontSize: 24, lineHeight: 32 },
  titleLarge: { fontSize: 22, lineHeight: 28 },
  titleMedium: { fontSize: 16, lineHeight: 24 },
  titleSmall: { fontSize: 14, lineHeight: 20 },
  bodyLarge: { fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontSize: 14, lineHeight: 20 },
  bodySmall: { fontSize: 12, lineHeight: 16 },
  labelLarge: { fontSize: 14, lineHeight: 20 },
  labelMedium: { fontSize: 12, lineHeight: 16 },
  labelSmall: { fontSize: 11, lineHeight: 16 },
};
```

### Color System
```typescript
// Dynamic color tokens
const MaterialColors = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  surface: '#FEF7FF',
  onSurface: '#1D1B20',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
};
```

## Security & Privacy
- Android Keystore for sensitive data storage
- Network security configuration
- App signing with Play App Signing
- Privacy-preserving analytics
- Biometric authentication with AndroidX
- Runtime permissions handling
- Certificate pinning for API calls

## Accessibility
- TalkBack screen reader support
- High contrast and large text support
- Touch target size compliance (48dp minimum)
- Semantic content descriptions
- Focus management for navigation
- Keyboard navigation support
