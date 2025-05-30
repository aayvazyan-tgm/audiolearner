import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '../components/Themed';
import { AudioRecording, AudioCategory } from '../types/AudioTypes';
import { 
  getRecordings, 
  getCategories, 
  deleteRecording,
  getRecordingsByCategory
} from '../utils/AudioStorage';

export default function TabTwoScreen() {
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [categories, setCategories] = useState<AudioCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  useEffect(() => {
    loadData();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);
  
  useEffect(() => {
    loadRecordingsByCategory();
  }, [selectedCategoryId]);
  
  const loadData = async () => {
    try {
      const loadedCategories = await getCategories();
      setCategories(loadedCategories);
      
      if (loadedCategories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(loadedCategories[0].id);
      }
      
      if (!selectedCategoryId) {
        const loadedRecordings = await getRecordings();
        setRecordings(loadedRecordings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load recordings.');
    }
  };
  
  const loadRecordingsByCategory = async () => {
    try {
      if (selectedCategoryId) {
        const filteredRecordings = await getRecordingsByCategory(selectedCategoryId);
        setRecordings(filteredRecordings);
      } else {
        const allRecordings = await getRecordings();
        setRecordings(allRecordings);
      }
    } catch (error) {
      console.error('Error loading recordings by category:', error);
      Alert.alert('Error', 'Failed to load recordings for this category.');
    }
  };
  
  const playAudio = async (recording: AudioRecording) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        
        if (playingId === recording.id) {
          setPlayingId(null);
          setIsPlaying(false);
          return;
        }
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      
      setSound(newSound);
      setPlayingId(recording.id);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };
  
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setPlayingId(null);
      setIsPlaying(false);
    }
  };
  
  const handleDeleteRecording = async (recordingId: string) => {
    try {
      if (playingId === recordingId && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
        setIsPlaying(false);
      }
      
      await deleteRecording(recordingId);
      
      await loadRecordingsByCategory();
      
      Alert.alert('Success', 'Recording deleted successfully.');
    } catch (error) {
      console.error('Error deleting recording:', error);
      Alert.alert('Error', 'Failed to delete recording.');
    }
  };
  
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const formattedHours = hours > 0 ? `${hours}:` : '';
    const formattedMinutes = `${minutes % 60}`.padStart(2, '0');
    const formattedSeconds = `${seconds % 60}`.padStart(2, '0');
    
    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
  };
  
  const renderCategoryItem = ({ item }: { item: AudioCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategoryId === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategoryId(item.id)}
    >
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  const renderRecordingItem = ({ item }: { item: AudioRecording }) => (
    <View style={styles.recordingItem}>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={() => playAudio(item)}
      >
        <Ionicons 
          name={playingId === item.id && isPlaying ? 'pause' : 'play'} 
          size={24} 
          color="#2196F3" 
        />
      </TouchableOpacity>
      
      <View style={styles.recordingInfo}>
        <Text style={styles.recordingName}>
          {item.filename.replace(/^recording_|\.\w+$/g, '')}
        </Text>
        <Text style={styles.recordingMeta}>
          {formatDate(item.dateCreated)} • {formatDuration(item.duration)}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Delete Recording',
            'Are you sure you want to delete this recording?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteRecording(item.id) }
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Playlist</Text>
      
      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>Kategorien:</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
        />
      </View>
      
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      {recordings.length > 0 ? (
        <FlatList
          data={recordings}
          renderItem={renderRecordingItem}
          keyExtractor={item => item.id}
          style={styles.recordingsList}
          contentContainerStyle={styles.recordingsListContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="mic-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Keine Aufnahmen in dieser Kategorie
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryContainer: {
    width: '100%',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryList: {
    flexGrow: 0,
  },
  categoryItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
  },
  selectedCategoryItem: {
    backgroundColor: '#2196F3',
  },
  categoryText: {
    fontSize: 14,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
  },
  recordingsList: {
    flex: 1,
    width: '100%',
  },
  recordingsListContent: {
    paddingBottom: 20,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});
