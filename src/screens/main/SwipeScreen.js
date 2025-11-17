import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Swiper from 'react-native-deck-swiper';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { likeCompanion, passCompanion, superLikeCompanion } from '../../store/slices/companionSlice';
import { addMatch } from '../../store/slices/matchSlice';

const { width, height } = Dimensions.get('window');

const SwipeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const swiperRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const { filteredList: companions, loading } = useSelector(state => state.companions);
  const [cardIndex, setCardIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);

  useEffect(() => {
    // Load companions on mount
    // dispatch(fetchCompanions());
  }, []);

  const handleSwipeRight = (index) => {
    const companion = companions[index];
    dispatch(likeCompanion(companion.id));
    
    // Check for match (simplified - in real app, check from backend)
    if (Math.random() > 0.7) { // 30% chance of match for demo
      setTimeout(() => {
        dispatch(addMatch(companion));
        setShowMatchModal(true);
      }, 300);
    }
  };

  const handleSwipeLeft = (index) => {
    const companion = companions[index];
    dispatch(passCompanion(companion.id));
  };

  const handleSwipeTop = (index) => {
    const companion = companions[index];
    dispatch(superLikeCompanion(companion.id));
    
    // Super like has higher match chance
    if (Math.random() > 0.5) {
      setTimeout(() => {
        dispatch(addMatch(companion));
        setShowMatchModal(true);
      }, 300);
    }
  };

  const onSwiped = (type, index) => {
    setCardIndex(index + 1);
  };

  const onSwipedAllCards = () => {
    Alert.alert(
      'No More Profiles',
      'Check back later for new companions or adjust your filters',
      [
        { text: 'Adjust Filters', onPress: () => navigation.navigate('SearchFilter') },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderCard = (companion, index) => {
    if (!companion) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CompanionProfile', { companion })}
        style={styles.card}
      >
        <Image
          source={{ uri: companion.photos?.[0] || 'https://via.placeholder.com/400' }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.cardInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{companion.name}, {companion.age}</Text>
              {companion.verified && (
                <Icon name="checkmark-circle" size={24} color="#4A90E2" style={styles.verifiedBadge} />
              )}
            </View>
            
            <View style={styles.locationContainer}>
              <Icon name="location-outline" size={16} color="#FFF" />
              <Text style={styles.location}>{companion.distance} km away</Text>
            </View>

            {companion.tagline && (
              <Text style={styles.tagline}>{companion.tagline}</Text>
            )}

            <View style={styles.tagsContainer}>
              {companion.interests?.slice(0, 3).map((interest, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Icon name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>{companion.rating?.toFixed(1) || 'New'}</Text>
              </View>
              <View style={styles.stat}>
                <Icon name="time-outline" size={16} color="#FFF" />
                <Text style={styles.statText}>₹{companion.hourlyRate}/hr</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {companion.isOnline && (
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderNoMoreCards = () => {
    return (
      <View style={styles.noMoreCards}>
        <Icon name="refresh-circle-outline" size={80} color="#DDD" />
        <Text style={styles.noMoreText}>No more profiles</Text>
        <Text style={styles.noMoreSubtext}>Try adjusting your filters</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('SearchFilter')}
        >
          <Text style={styles.filterButtonText}>Adjust Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="person-circle-outline" size={32} color="#FF6B6B" />
        </TouchableOpacity>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => navigation.navigate('SearchFilter')}>
          <Icon name="options-outline" size={32} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Swiper */}
      <View style={styles.swiperContainer}>
        {companions.length > 0 ? (
          <Swiper
            ref={swiperRef}
            cards={companions}
            renderCard={renderCard}
            onSwipedLeft={handleSwipeLeft}
            onSwipedRight={handleSwipeRight}
            onSwipedTop={handleSwipeTop}
            onSwiped={onSwiped}
            onSwipedAll={onSwipedAllCards}
            cardIndex={cardIndex}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={15}
            stackScale={10}
            disableBottomSwipe
            overlayLabels={{
              left: {
                title: 'PASS',
                style: {
                  label: {
                    backgroundColor: '#FF6B6B',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold',
                    padding: 10,
                    borderRadius: 10,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: -30,
                  },
                },
              },
              right: {
                title: 'LIKE',
                style: {
                  label: {
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold',
                    padding: 10,
                    borderRadius: 10,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: 30,
                  },
                },
              },
              top: {
                title: 'SUPER LIKE',
                style: {
                  label: {
                    backgroundColor: '#2196F3',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold',
                    padding: 10,
                    borderRadius: 10,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
              },
            }}
            animateOverlayLabelsOpacity
            animateCardOpacity
            swipeBackCard
          />
        ) : (
          renderNoMoreCards()
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Animated.View style={[styles.actionButton, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.button, styles.passButton]}
            onPress={() => {
              animateButton();
              swiperRef.current?.swipeLeft();
            }}
          >
            <Icon name="close" size={32} color="#FF6B6B" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.actionButton, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.button, styles.superLikeButton]}
            onPress={() => {
              animateButton();
              swiperRef.current?.swipeTop();
            }}
          >
            <Icon name="star" size={28} color="#2196F3" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.actionButton, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.button, styles.likeButton]}
            onPress={() => {
              animateButton();
              swiperRef.current?.swipeRight();
            }}
          >
            <Icon name="heart" size={32} color="#4CAF50" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => navigation.navigate('Emergency')}
      >
        <Icon name="warning" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: 120,
    height: 40,
  },
  swiperContainer: {
    flex: 1,
    paddingTop: 20,
  },
  card: {
    height: height * 0.65,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  cardInfo: {
    marginBottom: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 4,
  },
  tagline: {
    fontSize: 15,
    color: '#FFF',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  onlineBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  onlineText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  passButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  superLikeButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#2196F3',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likeButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noMoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  noMoreSubtext: {
    fontSize: 16,
    color: '#BBB',
    marginTop: 10,
    textAlign: 'center',
  },
  filterButton: {
    marginTop: 30,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  filterButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SwipeScreen;
