export enum AppStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  ALARMING = 'ALARMING',
  DISCONNECTED = 'DISCONNECTED'
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface TipsData {
  id: number;
  title: string;
  description: string;
  iconName: string;
}