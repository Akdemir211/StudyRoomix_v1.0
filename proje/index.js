// Polyfill uygulamalarını başlatmadan önce kontrol fonksiyonu
function applyPolyfills() {
  console.log('Polyfills uygulanıyor...');

  // Symbol.asyncIterator polyfill
  if (typeof Symbol === 'function' && !Symbol.asyncIterator) {
    Symbol.asyncIterator = Symbol('Symbol.asyncIterator');
  }

  // UUID için crypto.getRandomValues polyfill
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    global.crypto = {
      getRandomValues: function(arr) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }
    };
  }

  // Iterator ve Promise için polyfill
  const iteratorPromisePolyfill = () => {
    // Herhangi bir nesne için Symbol.asyncIterator destek eklemesi
    if (!Object.prototype[Symbol.asyncIterator]) {
      Object.defineProperty(Object.prototype, Symbol.asyncIterator, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function() {
          const o = this;
          
          if (!o) return { 
            next: () => Promise.resolve({ done: true }) 
          };
          
          if (typeof o.next === 'function') {
            return this;
          }
          
          if (typeof o.then === 'function') {
            return {
              next: () => o.then(v => ({ value: v, done: false }))
                         .catch(e => { throw e; }),
              [Symbol.asyncIterator]() { return this; }
            };
          }
          
          // Varsayılan iterator
          return {
            next: () => Promise.resolve({ value: undefined, done: true }),
            [Symbol.asyncIterator]() { return this; }
          };
        }
      });
      
      console.log('Global asyncIterator polyfill uygulandı');
    }
    
    // Promise için asyncIterator
    if (!Promise.prototype[Symbol.asyncIterator]) {
      Object.defineProperty(Promise.prototype, Symbol.asyncIterator, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function() {
          let resolved = false;
          let value;
          let error;
          
          // Promise'i izle
          this.then(
            v => { resolved = true; value = v; },
            e => { resolved = true; error = e; }
          );
          
          return {
            next: () => {
              if (!resolved) {
                return this.then(
                  v => ({ value: v, done: false }),
                  e => { throw e; }
                );
              }
              
              if (error) throw error;
              return Promise.resolve({ value, done: false });
            },
            return: () => Promise.resolve({ done: true }),
            throw: e => Promise.reject(e),
            [Symbol.asyncIterator]() { return this; }
          };
        }
      });
      
      console.log('Promise asyncIterator polyfill uygulandı');
    }
  };

  // Fetch için özel polyfill
  const fetchPolyfill = () => {
    if (typeof global.fetch !== 'undefined') {
      const originalFetch = global.fetch;
      
      global.fetch = function(...args) {
        return originalFetch.apply(this, args)
          .then(response => {
            return response;
          });
      };
      
      console.log('Fetch polyfill uygulandı');
    }
  };

  // Polyfill'leri uygula
  try {
    iteratorPromisePolyfill();
    fetchPolyfill();
  } catch (e) {
    console.error('Polyfill uygulanırken hata:', e);
  }
}

// Polyfill'leri uygula
applyPolyfills();

// Expo Router entry point
import 'expo-router/entry';