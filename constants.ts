import { TipsData } from './types';

export const COMPANY_INFO = {
  name: 'Benux Corp',
  contact: 'paul@benuxcorp.com',
  website: 'www.benuxcorp.com',
  version: '1.0.0',
};

export const GRADIENTS = {
  active: 'from-[#00D4FF] via-[#9D4EDD] to-[#FF006E]',
  inactive: 'from-[#1A1B2E] via-[#16213E] to-[#0F3460]',
  button: 'from-[#00D4FF] to-[#9D4EDD]',
};

export const TIPS_LIST: TipsData[] = [
  {
    id: 1,
    title: "Connect First",
    description: "Always connect your AUX cable before enabling the Keep-Alive feature.",
    iconName: "Cable"
  },
  {
    id: 2,
    title: "Safety Alarm",
    description: "If the cable is disconnected, a loud alarm will sound on your device speakers.",
    iconName: "Siren"
  },
  {
    id: 3,
    title: "Audio Routing",
    description: "iOS/Android automatically route sounds to wired speakers. This app ensures the connection stays active.",
    iconName: "Route"
  },
  {
    id: 4,
    title: "Do Not Disturb",
    description: "Enable 'Do Not Disturb' mode to prevent notification sounds from playing through the speaker.",
    iconName: "BellOff"
  },
  {
    id: 5,
    title: "Volume Logic",
    description: "The keep-alive signal is ultra-low volume (exponential scale) to be inaudible while keeping hardware awake.",
    iconName: "Activity"
  },
  {
    id: 6,
    title: "Background Run",
    description: "Alarmie continues running in the background. Don't force close the app.",
    iconName: "Layers"
  },
  {
    id: 7,
    title: "Responsibility",
    description: "Ensure your volume levels are safe. We are not responsible for hardware damage.",
    iconName: "ShieldAlert"
  },
  {
    id: 8,
    title: "Battery Usage",
    description: "Continuous audio generation uses a small amount of battery. Keep charged for long sessions.",
    iconName: "Battery"
  }
];