import ContactMessageListingWrapper from '@/components/features/contact-messages/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Contact Messages - ${config.appName}`,
};

export default function ContactMessagesPage() {
  return (
    <div>
      <ContactMessageListingWrapper />
    </div>
  );
}
