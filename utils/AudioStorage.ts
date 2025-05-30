import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { AudioCategory, AudioRecording } from '../types/AudioTypes';

const RECORDINGS_STORAGE_KEY = '@audiolearner:recordings';
const CATEGORIES_STORAGE_KEY = '@audiolearner:categories';

const DEFAULT_CATEGORIES: AudioCategory[] = [
  { id: '1', name: 'General' },
  { id: '2', name: 'Lectures' },
  { id: '3', name: 'Notes' },
  { id: '4', name: 'Reminders' }
];

const AUDIO_DIRECTORY = `${FileSystem.documentDirectory}audio/`;

export const initializeStorage = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
  }
  
  const categoriesJson = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!categoriesJson) {
    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }
};

export const saveRecording = async (recording: AudioRecording): Promise<void> => {
  try {
    const recordings = await getRecordings();
    
    recordings.push(recording);
    
    await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(recordings));
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
};

export const getRecordings = async (): Promise<AudioRecording[]> => {
  try {
    const recordingsJson = await AsyncStorage.getItem(RECORDINGS_STORAGE_KEY);
    return recordingsJson ? JSON.parse(recordingsJson) : [];
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
};

export const deleteRecording = async (recordingId: string): Promise<void> => {
  try {
    const recordings = await getRecordings();
    
    const recordingToDelete = recordings.find(r => r.id === recordingId);
    if (!recordingToDelete) return;
    
    await FileSystem.deleteAsync(recordingToDelete.uri, { idempotent: true });
    
    const updatedRecordings = recordings.filter(r => r.id !== recordingId);
    
    await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(updatedRecordings));
  } catch (error) {
    console.error('Error deleting recording:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<AudioCategory[]> => {
  try {
    const categoriesJson = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
    return categoriesJson ? JSON.parse(categoriesJson) : DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Error getting categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

export const addCategory = async (name: string): Promise<AudioCategory> => {
  try {
    const categories = await getCategories();
    
    const newCategory: AudioCategory = {
      id: Date.now().toString(),
      name
    };
    
    categories.push(newCategory);
    
    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    
    return newCategory;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const generateAudioFilename = (): string => {
  return `recording_${Date.now()}.m4a`;
};

export const getAudioFileUri = (filename: string): string => {
  return `${AUDIO_DIRECTORY}${filename}`;
};

export const getRecordingsByCategory = async (categoryId: string): Promise<AudioRecording[]> => {
  const recordings = await getRecordings();
  return recordings.filter(recording => recording.category === categoryId);
};
