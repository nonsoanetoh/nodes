export interface SettingProps {
  label: string;
  shortcut?: string[];
}

export interface DuoInputProps extends SettingProps {
  values: [number, number];
  onChange: (values: [number, number]) => void;
}

export interface ColorInputProps extends SettingProps {
  value: string;
  onChange: (value: string) => void;
}

export interface RadioInputProps extends SettingProps {
  values: string[];
  value: string;
  onChange: (value: string) => void;
  triggeredKey?: string | null;
}

export interface RangeInputProps extends SettingProps {
  value: number;
  clamp: [number, number];
  step: number;
  onChange: (value: number) => void;
  triggeredKey?: string | null;
  showValueIndicator?: boolean;
  /** Optional image URL (e.g. data URL) for the draggable indicator, e.g. frame thumbnail */
  indicatorThumbnail?: string | null;
}

export interface ButtonControlProps extends SettingProps {
  onClick: (value: string) => void;
  triggeredKey?: string | null;
  icon?: React.ReactNode;
  alignment?: "default" | "super";
  disabled?: boolean;
  showLabel?: boolean;
}

export interface ImageInputProps extends SettingProps {
  value?: string | null;
  onChange: (file: File | null) => void;
}

export interface SelectInputProps extends SettingProps {
  value?: string;
  options: string[];
  onChange: (value: string) => void;
}

export interface ImageListInputProps extends SettingProps {
  value?: string[];
  onChange: (images: string[]) => void;
  showImages?: boolean;
  onShowImagesChange?: (show: boolean) => void;
}
