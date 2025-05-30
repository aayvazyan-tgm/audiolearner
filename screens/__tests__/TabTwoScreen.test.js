import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TabTwoScreen from '../TabTwoScreen';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as AudioStorage from '../../utils/AudioStorage';

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue({}),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setOnPlaybackStatusUpdate: jest.fn(),
        }
      }),
    }
  },
  InterruptionModeIOS: {
    DoNotMix: 1,
  },
  InterruptionModeAndroid: {
    DoNotMix: 1,
  },
}));

jest.mock('../../utils/AudioStorage', () => ({
  getRecordings: jest.fn().mockResolvedValue([
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
  ]),
  getCategories: jest.fn().mockResolvedValue([
    { id: '1', name: 'General' },
    { id: '2', name: 'Lectures' },
  ]),
  deleteRecording: jest.fn().mockResolvedValue(undefined),
  getRecordingsByCategory: jest.fn().mockImplementation((categoryId) => {
    if (categoryId === '1') {
      return Promise.resolve([{
        id: '1',
        filename: 'recording_123456789.m4a',
        category: '1',
        duration: 60000,
        dateCreated: 1622548800000,
        uri: 'file://test/recording_123456789.m4a'
      }]);
    } else if (categoryId === '2') {
      return Promise.resolve([{
        id: '2',
        filename: 'recording_987654321.m4a',
        category: '2',
        duration: 120000,
        dateCreated: 1622635200000,
        uri: 'file://test/recording_987654321.m4a'
      }]);
    }
    return Promise.resolve([]);
  }),
}));

describe('TabTwoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders playlist correctly', async () => {
    const { getByText } = render(<TabTwoScreen />);
    
    await waitFor(() => {
      expect(getByText('Playlist')).toBeTruthy();
      expect(getByText('Kategorien:')).toBeTruthy();
      expect(getByText('General')).toBeTruthy();
      expect(getByText('Lectures')).toBeTruthy();
    });
    
    expect(AudioStorage.getCategories).toHaveBeenCalled();
    expect(AudioStorage.getRecordingsByCategory).toHaveBeenCalled();
  });

  test('handles audio playback', async () => {
    const { getAllByRole } = render(<TabTwoScreen />);
    
    await waitFor(() => {
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      fireEvent.press(buttons[0]);
    });
    
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });
  });

  test('filters recordings by category', async () => {
    const { getByText } = render(<TabTwoScreen />);
    
    await waitFor(() => {
      expect(getByText('General')).toBeTruthy();
      expect(getByText('Lectures')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Lectures'));
    
    expect(AudioStorage.getRecordingsByCategory).toHaveBeenCalledWith('2');
  });

  test('handles empty recordings list', async () => {
    AudioStorage.getRecordingsByCategory.mockResolvedValueOnce([]);
    
    const { getByText } = render(<TabTwoScreen />);
    
    await waitFor(() => {
      expect(getByText('Keine Aufnahmen in dieser Kategorie')).toBeTruthy();
    });
  });
});
