import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TabOneScreen from '../TabOneScreen';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as AudioStorage from '../../utils/AudioStorage';

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setAudioModeAsync: jest.fn().mockResolvedValue({}),
    Recording: {
      createAsync: jest.fn().mockResolvedValue({
        recording: {
          setOnRecordingStatusUpdate: jest.fn(),
          setProgressUpdateInterval: jest.fn(),
          startAsync: jest.fn(),
          pauseAsync: jest.fn(),
          stopAndUnloadAsync: jest.fn(),
          getURI: jest.fn().mockReturnValue('file://test/recording.m4a'),
        }
      }),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
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
  initializeStorage: jest.fn().mockResolvedValue(undefined),
  getCategories: jest.fn().mockResolvedValue([
    { id: '1', name: 'General' },
    { id: '2', name: 'Lectures' },
  ]),
  saveRecording: jest.fn().mockResolvedValue(undefined),
  generateAudioFilename: jest.fn().mockReturnValue('recording_123456789.m4a'),
  getAudioFileUri: jest.fn().mockReturnValue('file://test/recording_123456789.m4a'),
}));

describe('TabOneScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', async () => {
    const { getByText } = render(<TabOneScreen />);
    
    await waitFor(() => {
      expect(getByText('Audio Aufnahme')).toBeTruthy();
      expect(getByText('Aufnahme starten')).toBeTruthy();
    });
    
    expect(AudioStorage.initializeStorage).toHaveBeenCalled();
    expect(AudioStorage.getCategories).toHaveBeenCalled();
    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });
  });

  test('handles recording start/stop flow', async () => {
    const { getByText } = render(<TabOneScreen />);
    
    await waitFor(() => {
      expect(getByText('Aufnahme starten')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Aufnahme starten'));
    
    expect(Audio.Recording.createAsync).toHaveBeenCalledWith(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    await waitFor(() => {
      expect(getByText('Pause')).toBeTruthy();
      expect(getByText('Aufnahme beenden')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Aufnahme beenden'));
    
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
    expect(AudioStorage.saveRecording).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(getByText('Aufnahme starten')).toBeTruthy();
    });
  });

  test('handles pause/resume recording', async () => {
    const { getByText } = render(<TabOneScreen />);
    
    await waitFor(() => {
      expect(getByText('Aufnahme starten')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Aufnahme starten'));
    
    await waitFor(() => {
      expect(getByText('Pause')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Pause'));
    
    await waitFor(() => {
      expect(getByText('Fortsetzen')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Fortsetzen'));
    
    await waitFor(() => {
      expect(getByText('Pause')).toBeTruthy();
    });
  });

  test('handles permission denial gracefully', async () => {
    Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    
    const { getByText } = render(<TabOneScreen />);
    
    await waitFor(() => {
      expect(getByText('Aufnahme starten')).toBeTruthy();
    });
    
    const startButton = getByText('Aufnahme starten');
    expect(startButton.props.disabled).toBe(true);
  });
});
