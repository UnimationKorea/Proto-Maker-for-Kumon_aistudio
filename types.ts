
export type StageType = 'handwriting' | 'drag_drop' | 'speech';
export type InputType = 'pad' | 'direct';

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
  id: string;
  type: StageType;
  inputType?: InputType;
  title: string;
  instructions?: string;
  sentence?: {
    pre: string;
    post: string;
    y: number;
  };
  targets?: Target[];
  hintText?: string[];
  audioWord?: string;
  lang?: string;
  tokens?: Token[];
  sourceItems?: string[];
}

export interface Activity {
  title: string;
  description: string;
  stages: ActivityStage[];
}

export type EditorMode = 'edit' | 'preview';
