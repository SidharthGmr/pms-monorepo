'use client';

import React from 'react';

const OrderWhatsApp = ({ order }) => {
  const sendWhatsAppMessage = () => {
    if (!order) return;

    // Format the message
    const message = `Order Details:
Order #: ${order.orderNumber || order.id || 'N/A'}
Date: ${order.date || new Date(order.createdAt).toLocaleDateString() || 'N/A'}
Total: $${order.total || '0.00'}

Items:
${order.items && order.items.length > 0 
  ? order.items.map(item => `- ${item.name} x${item.quantity || 1} - $${item.price}`).join('\n')
  : 'No items'}

Customer: ${order.customerName || 'N/A'}
Phone: ${order.customerPhone || 'N/A'}
Delivery Address: ${order.address || 'N/A'}`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Clean and use the customer's phone number if available, otherwise fallback to your business number
    // Remove any non-numeric characters except for a leading plus sign
    const rawPhone = order.customerPhone || '1234567890';
    const phoneNumber = rawPhone.replace(/[^\d+]/g, ''); 
    
    // Open WhatsApp Chat link
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <button 
      onClick={sendWhatsAppMessage} 
      className="whatsapp-btn flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
    >
      <svg 
        className="w-5 h-5 fill-current" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.861-4.416 9.863-9.864.001-2.639-1.026-5.122-2.892-6.991-1.866-1.869-4.353-2.898-6.995-2.899-5.444 0-9.866 4.418-9.869 9.866-.001 1.848.482 3.655 1.4 5.223l-1.01 3.693 3.878-.978zm11.267-6.682c-.097-.163-.359-.261-.75-.457-.393-.197-2.322-1.148-2.682-1.279-.36-.131-.623-.197-.885.197-.261.393-1.014 1.279-1.242 1.541-.228.262-.456.295-.848.098-.393-.197-1.659-.611-3.161-1.951-1.168-1.042-1.957-2.33-2.186-2.724-.229-.393-.024-.606.173-.802.176-.176.393-.457.589-.687.196-.229.262-.393.393-.655.13-.262.065-.491-.033-.687-.098-.197-.885-2.13-1.212-2.916-.32-.767-.643-.664-.885-.676-.229-.012-.491-.015-.753-.015-.261 0-.687.098-1.046.491-.359.393-1.372 1.343-1.372 3.275 0 1.933 1.406 3.801 1.602 4.063.197.262 2.767 4.226 6.703 5.922.936.404 1.667.646 2.237.826.942.299 1.799.257 2.477.155.757-.113 2.322-.95 2.649-1.868.328-.917.328-1.704.229-1.868z"/>
      </svg>
      Send Order on WhatsApp
    </button>
  );
};

export default OrderWhatsApp;
