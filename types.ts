
export type AspectRatio = '16:9' | '9:16' | '1:1';

export enum AppStep {
  IDEA_INPUT,
  GENRE_SELECTION,
  GENERATING,
  RESULT,
  ERROR
}

export interface Character {
  id: string;
  name: string;
  imageData: string; // Base64 / Data URL
  isLocked: boolean;
}

export interface VisualCue {
  text: string;
  isLocked: boolean;
}

export interface ScriptPart {
  number: number;
  text: string;
}

export interface GalleryItem {
  id: string;
  data: string;
  name: string;
  timestamp: number;
}

export interface Scene {
  id: string;
  title: string;
  characters: string[];
  environment: string;
  script: string;
  action: string;
  generatedPrompt: string; // The primary sequence prompt
  timestamp: number;
  imageData?: string; // Primary thumbnail (usually first frame)
  firstFramePrompt?: string;
  lastFramePrompt?: string;
  firstFrameData?: string;
  lastFrameData?: string;
}

export interface VideoResult {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  sourceSceneId?: string;
}

export interface AppState {
  characters: Character[];
  visualCue: VisualCue;
  fullStory: string;
  scriptParts: ScriptPart[]; 
  scenes: Scene[]; 
  startKeyframes: Scene[];
  endKeyframes: Scene[];
  startGallery: GalleryItem[];
  endGallery: GalleryItem[];
  aspectRatio: AspectRatio;
  generatedVideos?: VideoResult[];
}

// ToonCluster Specific Types
export interface ToonCharacter {
  name: string;
  description: string;
  personality?: string;
}

export interface ToonScene {
  sceneNumber: number;
  title: string;
  visualSetting: string;
  action: string;
  dialogue: { character: string; line: string }[];
  educationalPillars?: string[];
}

export interface CartoonScript {
  title: string;
  youtubeTitle: string;
  concept: string;
  characters: ToonCharacter[];
  scenes: ToonScene[];
  fullNarrative?: string[]; // Array of paragraphs
}

export interface ToonSeedCharacter {
  name: string;
  description: string;
  isConfirmed?: boolean;
}

export interface ScriptRequest {
  topic: string;
  targetAudience: string;
  genres: string[];
  durationMinutes: number;
  instructions: string;
  seedCharacters?: ToonSeedCharacter[];
}

// --- AUDIOBEAST TYPES ---

export interface AudioSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker: string;
  emotion: string;
  language: string;
}

export interface AudioAnalysis {
  transcript: AudioSegment[];
  overallEmotion: string;
  languageDetected: string;
  tempoEstimate?: number;
  moodTags: string[];
}

export interface EditStep {
  type: 'trim' | 'fade' | 'normalize' | 'eq' | 'noise-reduction' | 'tempo' | 'pitch' | 'compress' | 'limiter';
  params: Record<string, any>;
  description: string;
}

export interface AudioEditPlan {
  steps: EditStep[];
  explanation: string;
  targetLufs?: number;
}
