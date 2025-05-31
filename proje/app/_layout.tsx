import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack 
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            animationEasing: 'ease-in-out',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            contentStyle: {
              backgroundColor: 'transparent',
            },
            presentation: 'card',
          }}
        >
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              animation: 'fade',
              animationDuration: 400,
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              animation: 'fade',
              animationDuration: 400,
            }} 
          />
          <Stack.Screen 
            name="pro-upgrade" 
            options={{ 
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 300,
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }} 
          />
          <Stack.Screen 
            name="+not-found" 
            options={{ 
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 300,
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </AuthProvider>
    </ThemeProvider>
  );
}