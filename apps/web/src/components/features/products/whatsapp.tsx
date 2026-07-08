import { useState } from 'react';

export default function Whatsapp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    // 1. Format number (remove all spaces, symbols, keep leading '1' for US/Canada)
    let formattedNumber = phoneNumber.replace(/[\s\(\)\-]/g, '');
    if (formattedNumber.length > 0 && !formattedNumber.startsWith('1')) {
      formattedNumber = '1' + formattedNumber;
    }

    // 2. Format message (encode URI components)
    const encodedMessage = encodeURIComponent(message);

    // 3. Build and open link
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div>
      <input type="tel" placeholder="Your WhatsApp Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      <textarea placeholder="Your Message" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={handleSend}>Send via WhatsApp</button>
    </div>
  );
}
