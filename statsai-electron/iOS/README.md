# iOS Mobile Development - StatsAI Electron

## Overview
This folder contains the iOS mobile implementation of the StatsAI Electron applications, including the email-assistant and ai-search features optimized for mobile deployment.

## Tech Stack
- **React Native** with TypeScript
- **NativeWind** (Tailwind CSS for React Native)
- **shadcn/ui components** adapted for mobile
- **Expo** for development and deployment
- **iOS Simulator** for testing

## Quick Setup

### Prerequisites
```bash
# Install Node.js dependencies
npm install -g @expo/cli
npm install -g react-native-cli

# Install iOS development tools (macOS only)
xcode-select --install
```

### Project Initialization
```bash
# Create new Expo project with TypeScript
npx create-expo-app --template blank-typescript

# Install NativeWind for Tailwind CSS
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Install navigation and UI dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
```

### shadcn/ui Mobile Configuration
```bash
# Initialize shadcn for mobile
npx shadcn-ui@latest init

# Install essential mobile components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add drawer
```

## Architecture

### Directory Structure
```
iOS/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn components adapted for mobile
│   │   ├── email/        # Email assistant components
│   │   ├── search/       # AI search components
│   │   └── shared/       # Shared mobile components
│   ├── screens/
│   │   ├── EmailScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── DashboardScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── services/
│   │   ├── emailService.ts
│   │   ├── searchService.ts
│   │   └── voiceService.ts
│   ├── hooks/
│   │   ├── useVoiceCommand.ts
│   │   └── useHapticFeedback.ts
│   └── styles/
│       └── tailwind.config.js
├── assets/
├── app.json
├── package.json
└── components.json
```

## iOS-Specific Features

### Glass Design Implementation
```typescript
// Glass morphism component for iOS
import { View, BlurView } from 'expo-blur';

const GlassCard = ({ children, intensity = 80 }) => (
  <BlurView 
    intensity={intensity}
    style={{
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    }}
  >
    <View style={{ padding: 16 }}>
      {children}
    </View>
  </BlurView>
);
```

### Voice Integration (Siri)
```typescript
// Voice command handling for iOS
import { Speech } from 'expo-speech';
import * as SpeechRecognition from 'expo-speech-recognition';

class iOSVoiceService {
  async startListening() {
    const { status } = await SpeechRecognition.requestPermissionsAsync();
    if (status === 'granted') {
      const result = await SpeechRecognition.start({
        language: 'en-US',
        interimResults: true,
      });
      return result;
    }
  }

  processVoiceCommand(transcript: string) {
    const commands = {
      'search emails': () => navigateToEmailSearch(),
      'compose email': () => openEmailComposer(),
      'show analytics': () => displayAnalytics(),
    };
    
    return commands[transcript.toLowerCase()]?.();
  }
}
```

### Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

export const useHapticFeedback = () => {
  const lightImpact = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const mediumImpact = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const heavyImpact = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  
  return { lightImpact, mediumImpact, heavyImpact };
};
```

## Development Workflow

### Running in Simulator
```bash
# Start Expo development server
npx expo start

# Run in iOS simulator
npx expo run:ios

# Run specific simulator device
npx expo run:ios --device "iPhone 15 Pro"
```

### Building for Device Testing
```bash
# Create development build
eas build --platform ios --profile development

# Create preview build for TestFlight
eas build --platform ios --profile preview

# Submit to App Store
eas submit --platform ios
```

### Testing Strategy
```bash
# Unit tests with Jest
npm test

# E2E tests with Detox
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug

# Visual regression tests
npm run test:visual
```

## Component Adaptations

### Mobile-Optimized Components
```typescript
// Mobile button with haptic feedback
const MobileButton = ({ onPress, haptic = 'light', ...props }) => {
  const { lightImpact, mediumImpact } = useHapticFeedback();
  
  const handlePress = () => {
    if (haptic === 'light') lightImpact();
    if (haptic === 'medium') mediumImpact();
    onPress?.();
  };

  return (
    <Button
      onPress={handlePress}
      className="min-h-[44px] rounded-xl"
      {...props}
    />
  );
};
```

### Voice-Enabled Search
```typescript
const VoiceSearch = () => {
  const [isListening, setIsListening] = useState(false);
  const voiceService = new iOSVoiceService();

  const toggleVoiceSearch = async () => {
    if (isListening) {
      voiceService.stopListening();
    } else {
      const result = await voiceService.startListening();
      voiceService.processVoiceCommand(result.transcript);
    }
    setIsListening(!isListening);
  };

  return (
    <View className="flex-row items-center space-x-2 p-4">
      <Input placeholder="Search or speak..." className="flex-1" />
      <MobileButton
        variant={isListening ? "destructive" : "outline"}
        onPress={toggleVoiceSearch}
        haptic="medium"
      >
        <Mic className={isListening ? "animate-pulse" : ""} />
      </MobileButton>
    </View>
  );
};
```

## Email Assistant Mobile Features
- Swipe gestures for email actions (archive, delete, reply)
- Voice-to-text email composition
- Smart email categorization with visual indicators
- Quick reply templates optimized for mobile input
- Push notifications for important emails

## AI Search Mobile Features
- Voice search with real-time transcription
- Gesture-based navigation through search results
- Offline search capabilities with local caching
- Context-aware search based on location and time
- Integration with iOS Spotlight search

## Performance Optimization
- Lazy loading for email lists and search results
- Image optimization for email attachments
- Background app refresh for email sync
- Memory management for large datasets
- Battery-efficient voice processing

## Deployment Pipeline

### Development
```bash
# Local development with hot reload
npx expo start --dev-client

# Preview on physical device
npx expo install expo-dev-client
```

### Staging
```bash
# Build for internal testing
eas build --platform ios --profile preview
eas submit --platform ios --profile preview
```

### Production
```bash
# Production build
eas build --platform ios --profile production
eas submit --platform ios --auto
```

## Debugging & Monitoring
- React Native Debugger for component inspection
- Flipper integration for network monitoring
- Crash reporting with Sentry
- Performance monitoring with custom metrics
- User analytics with privacy-first approach

## Security Considerations
- Keychain storage for sensitive data
- Certificate pinning for API calls
- Biometric authentication integration
- App Transport Security compliance
- Data encryption for local storage
