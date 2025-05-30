import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Text, View } from '../components/Themed';
import { RecordingStatus, AudioCategory } from '../types/AudioTypes';
import { 
  initializeStorage, 
  getCategories, 
  saveRecording, 
  generateAudioFilename, 
  getAudioFileUri 
} from '../utils/AudioStorage';

export default function TabOneScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingTime, setRecordingTime] = useState<string>('00:00:00');
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  
  const [categories, setCategories] = useState<AudioCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AudioCategory | null>(null);
  
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        await initializeStorage();
        const loadedCategories = await getCategories();
        setCategories(loadedCategories);
        if (loadedCategories.length > 0) {
          setSelectedCategory(loadedCategories[0]);
        }
        
        const permission = await Audio.requestPermissionsAsync();
        setAudioPermission(permission.status === 'granted');
        
        if (permission.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'This app needs access to your microphone to record audio.',
            [{ text: 'OK' }]
          );
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });
      } catch (error) {
        console.error('Error setting up audio recording:', error);
        Alert.alert('Error', 'Failed to initialize audio recording.');
      }
    };
    
    setup();
    
    return () => {
      if (timer) clearInterval(timer);
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);
  
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = (minutes % 60).toString().padStart(2, '0');
    const formattedSeconds = (seconds % 60).toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };
  
  const startRecording = async () => {
    try {
      if (!audioPermission) {
        const permission = await Audio.requestPermissionsAsync();
        setAudioPermission(permission.status === 'granted');
        
        if (permission.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'This app needs access to your microphone to record audio.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      if (!selectedCategory) {
        Alert.alert('Error', 'Please select a category before recording.');
        return;
      }
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setRecordingStatus(RecordingStatus.RECORDING);
      
      const interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1000;
          setRecordingTime(formatTime(newDuration));
          return newDuration;
        });
      }, 1000);
      
      setTimer(interval);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };
  
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      if (!uri) {
        throw new Error('Recording URI is null');
      }
      
      const filename = generateAudioFilename();
      const fileUri = getAudioFileUri(filename);
      
      await Audio.Sound.createAsync({ uri });
      
      if (selectedCategory) {
        await saveRecording({
          id: Date.now().toString(),
          filename,
          category: selectedCategory.id,
          duration: recordingDuration,
          dateCreated: Date.now(),
          uri: fileUri
        });
      }
      
      setRecording(null);
      setRecordingStatus(RecordingStatus.IDLE);
      setRecordingDuration(0);
      setRecordingTime('00:00:00');
      
      Alert.alert('Success', 'Recording saved successfully.');
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to save recording.');
    }
  };
  
  const pauseRecording = async () => {
    try {
      if (!recording) return;
      
      if (recordingStatus === RecordingStatus.RECORDING) {
        await recording.pauseAsync();
        setRecordingStatus(RecordingStatus.PAUSED);
        
        if (timer) {
          clearInterval(timer);
          setTimer(null);
        }
      } else if (recordingStatus === RecordingStatus.PAUSED) {
        await recording.startAsync();
        setRecordingStatus(RecordingStatus.RECORDING);
        
        const interval = setInterval(() => {
          setRecordingDuration(prev => {
            const newDuration = prev + 1000;
            setRecordingTime(formatTime(newDuration));
            return newDuration;
          });
        }, 1000);
        
        setTimer(interval);
      }
    } catch (error) {
      console.error('Error pausing/resuming recording:', error);
      Alert.alert('Error', 'Failed to pause/resume recording.');
    }
  };
  
  const renderCategoryItem = ({ item }: { item: AudioCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Aufnahme</Text>
      
      <View style={styles.recordingInfo}>
        <Text style={styles.timeText}>{recordingTime}</Text>
        <Text style={styles.statusText}>
          {recordingStatus === RecordingStatus.RECORDING ? 'Recording...' : 
           recordingStatus === RecordingStatus.PAUSED ? 'Paused' : 'Ready'}
        </Text>
      </View>
      
      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>Kategorie:</Text>
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
      
      <View style={styles.controls}>
        {recordingStatus === RecordingStatus.IDLE ? (
          <Button 
            title="Aufnahme starten" 
            onPress={startRecording} 
            disabled={!audioPermission || !selectedCategory}
          />
        ) : (
          <>
            <Button 
              title={recordingStatus === RecordingStatus.RECORDING ? "Pause" : "Fortsetzen"} 
              onPress={pauseRecording} 
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Aufnahme beenden" 
              onPress={stopRecording} 
              color="red"
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  recordingInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
  },
  categoryContainer: {
    width: '100%',
    marginBottom: 20,
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
    width: '80%',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  buttonSpacer: {
    width: 20,
  },
});
