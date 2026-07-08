import { useStore } from 'react-redux';
import type { AppStore } from './store';


export const useAppStore: () => AppStore = useStore;
