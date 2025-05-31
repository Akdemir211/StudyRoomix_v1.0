import { EventEmitter } from 'events';

// Global olay yayınlayıcı
export const eventEmitter = new EventEmitter();

// Mevcut Node.js davranışını değiştir, dinleyici sınırını arttır
eventEmitter.setMaxListeners(20);

// Kullanılabilir olaylar
export const Events = {
  USER_DATA_UPDATED: 'userDataUpdated',
}; 