// components/ZombieVisionFilter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ZombieVisionFilter({ isZombie, children }) {
  if (!isZombie) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {children}
      <View style={styles.grayscaleOverlay} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grayscaleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    // CSS filter simulation - this creates a grayscale effect
    // Note: React Native doesn't support CSS filters directly,
    // so we'll need to use a library like react-native-color-matrix-image-filters
    // or implement this on the native side
    // For now, this is a placeholder
    opacity: 0.3,
    mixBlendMode: 'saturation', // This won't work in RN, needs native implementation
  }
});

// Alternative approach using tintColor for images
export const applyZombieVision = (style, isZombie) => {
  if (!isZombie) return style;
  
  return {
    ...style,
    // Reduce saturation effect
    opacity: 0.9,
  };
};

// For player highlighting in zombie vision
export const getPlayerVisibilityStyle = (isZombie) => {
  if (!isZombie) return {};
  
  return {
    // Make players stand out more
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  };
};
