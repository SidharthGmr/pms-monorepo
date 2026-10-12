import PosTerminal from '@/components/features/pos-terminal';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `POS - ${config.appName}`,
};

export default function PosPage() {
  return <PosTerminal />;
}
