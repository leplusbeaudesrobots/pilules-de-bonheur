import { useColorScheme } from 'react-native';

const light = {
  bg: '#FFF4EA',
  card: '#FFFFFF',
  ink: '#2A1A12',
  muted: '#8A7566',
  line: '#F0E2D6',
  coral: '#FF6B4A',
  coralSoft: '#FFE3DA',
  green: '#2FA66A',
  greenSoft: '#D9F3E4',
  joker: '#F5B93B',
  missed: '#EADBCF',
  future: '#F7EDE4',
};

export type Theme = typeof light;

const dark: Theme = {
  bg: '#17110D',
  card: '#241A14',
  ink: '#FFF4EA',
  muted: '#A8968A',
  line: '#33261E',
  coral: '#FF6B4A',
  coralSoft: '#4A2418',
  green: '#3DBE7C',
  greenSoft: '#173A28',
  joker: '#F5B93B',
  missed: '#3A2D25',
  future: '#1F1712',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
