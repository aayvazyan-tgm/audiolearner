/**
 * Types for audio recording and categorization
 */

export interface AudioRecording {
  id: string;
  filename: string;
  category: string;
  duration: number; // in milliseconds
  dateCreated: number; // timestamp
  uri: string; // file URI for playback
}

export interface AudioCategory {
  id: string;
  name: string;
}

export interface AudioState {
  recordings: AudioRecording[];
  categories: AudioCategory[];
  selectedCategoryId: string | null;
}

export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  PAUSED = 'paused',
}
