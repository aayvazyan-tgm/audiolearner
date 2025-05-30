import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as AudioStorage from '../AudioStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('AudioStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@audiolearner:categories') {
        return Promise.resolve(JSON.stringify([
          { id: '1', name: 'General' },
          { id: '2', name: 'Lectures' },
        ]));
      } else if (key === '@audiolearner:recordings') {
        return Promise.resolve(JSON.stringify([
          {
            id: '1',
            filename: 'recording_123456789.m4a',
            category: '1',
            duration: 60000,
            dateCreated: 1622548800000,
            uri: 'file://test/recording_123456789.m4a'
          },
          {
            id: '2',
            filename: 'recording_987654321.m4a',
            category: '2',
            duration: 120000,
            dateCreated: 1622635200000,
            uri: 'file://test/recording_987654321.m4a'
          }
        ]));
      }
      return Promise.resolve(null);
    });
  });

  test('initializes storage correctly', async () => {
    await AudioStorage.initializeStorage();
    
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@audiolearner:categories');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@audiolearner:categories', expect.any(String));
  });

  test('gets categories correctly', async () => {
    const categories = await AudioStorage.getCategories();
    
    expect(categories).toEqual([
      { id: '1', name: 'General' },
      { id: '2', name: 'Lectures' },
    ]);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@audiolearner:categories');
  });

  test('gets recordings correctly', async () => {
    const recordings = await AudioStorage.getRecordings();
    
    expect(recordings).toHaveLength(2);
    expect(recordings[0].id).toBe('1');
    expect(recordings[1].id).toBe('2');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@audiolearner:recordings');
  });

  test('gets recordings by category correctly', async () => {
    const recordings = await AudioStorage.getRecordingsByCategory('1');
    
    expect(recordings).toHaveLength(1);
    expect(recordings[0].id).toBe('1');
    expect(recordings[0].category).toBe('1');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@audiolearner:recordings');
  });

  test('saves recording correctly', async () => {
    const newRecording = {
      id: '3',
      filename: 'recording_555555555.m4a',
      category: '1',
      duration: 30000,
      dateCreated: 1622721600000,
      uri: 'file://test/recording_555555555.m4a'
    };
    
    await AudioStorage.saveRecording(newRecording);
    
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@audiolearner:recordings');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@audiolearner:recordings', expect.any(String));
  });

  test('deletes recording correctly', async () => {
    await AudioStorage.deleteRecording('1');
    
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@audiolearner:recordings');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@audiolearner:recordings', expect.any(String));
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  test('generates audio filename correctly', () => {
    const filename = AudioStorage.generateAudioFilename();
    
    expect(filename).toMatch(/^recording_\d+\.m4a$/);
  });

  test('gets audio file URI correctly', () => {
    const uri = AudioStorage.getAudioFileUri('test.m4a');
    
    expect(uri).toBe('file://test/test.m4a');
  });
});
