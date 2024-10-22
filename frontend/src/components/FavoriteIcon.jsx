import React, { useState } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const FavoriteIcon = ({ isFavorite, onPress }) => {
  const [isStarred, setIsStarred] = useState(isFavorite);
  const [pressed, setPressed] = useState(false);
  const scaleAnim = new Animated.Value(1);  // For scale animation when pressed

  const toggleFavorite = () => {
    setIsStarred(!isStarred);
    if (onPress && typeof onPress === 'function') {
      onPress(); // Execute any additional actions, like updating the backend
    } else {
      console.log("No onPress function provided");
    }
  };

//   const toggleFavorite = async (contactId) => {
//     // You can update the favorite status in Supabase, for example:
//     const { data, error } = await supabase
//       .from("contacts")
//       .update({ isFavorite: !isFavorite })
//       .eq("id", contactId);
//     if (error) {
//       console.error("Error updating favorite status:", error);
//     } else {
//       setIsFavorite(!isFavorite); // Update local state
//       queryClient.invalidateQueries(["contacts", user?.id]); // Refetch contacts
//     }
//   };
  

  const handlePressIn = () => {
    setPressed(true);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3, // Scale up slightly above the original size
        friction: 2,  // Adjust friction to make the bounce feel more natural
        tension: 100, // Tension for bouncing effect
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, // Return to original size
        friction: 5, // Slightly higher friction to stop the bounce
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1, // Scale back down to original size if necessary
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      style={[
        styles.iconContainer,
        isStarred && styles.favoriteShadow, // Apply outer shadow only when favorited
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={toggleFavorite}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }], // Apply bouncing animation
          },
        ]}
      >
        <FontAwesome
          name={isStarred ? 'star' : 'star-o'} // Filled star for favorite, empty for not favorite
          size={24}
          color={isStarred ? '#FFD700' : '#888'} // Gold for favorite, grey for not favorite
          style={[
            pressed ? styles.pressedGlow : null,   // Apply yellow glow when pressed
            styles.iconWithOutline,  // Add grey outline to the star itself
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 50, // Make it a circular pressable
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteShadow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6, // Slightly stronger shadow when favorited
  },
  pressedGlow: {
    textShadowColor: '#FFD700', // Yellow glow color
    textShadowOffset: { width: 0, height: 0 },  // No offset, glow appears around text
    textShadowRadius: 3,  // Larger radius for more glow
  },
  iconWithOutline: {
    textShadowColor: '#888', // Grey color for the outline
    textShadowOffset: { width: 0, height: 0 },  // No offset, the shadow appears evenly around the icon
    textShadowRadius: 2,  // Adjust radius for the thickness of the outline
  },
});

export default FavoriteIcon;
