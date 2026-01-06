
export type StageType = 'normal' | 'hint_audio' | 'drag_drop';
export type InputType = 'pad' | 'direct' | 'drag';

// Added EditorMode for Header component
export type EditorMode = 'edit' | 'preview';

// Added Interaction for Preview and PropertyPanel components
export interface Interaction {
  trigger: 'click' | 'hover';
  action: 'none' | 'next_slide' | 'prev_slide' | 'goto_slide' | 'show_message' | 'play_sound';
  targetSlide?: number;
  message?: string;
}

// Added ActivityElement for Stage and PropertyPanel components
export interface ActivityElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  styles: any;
  interaction?: Interaction;
}

// Added Slide for Stage and Preview components
export interface Slide {
  id: string;
  backgroundColor: string;
  elements: ActivityElement[];
}

export interface Target {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Token {
  char: string;
  pinyin: string;
  fixed: boolean;
}

export interface ActivityStage {
  id: number;
  type: StageType;
  inputType: InputType;
  title: string;
  subText?: string;
  sentence?: {
    pre: string;
    post: string;
    y: number;
  };
  targets?: Target[];
  hintText?: string[];
  audioWord?: string;
  maxAudioPlays?: number;
  tokens?: Token[];
  sourceItems?: string[];
  lang?: string;
}

export interface Activity {
  title: string;
  stages: ActivityStage[];
  // Added slides to support components that use a slide-based structure
  slides: Slide[];
}
