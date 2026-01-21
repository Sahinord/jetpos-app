// Test için örnek barkod numaraları
export const TEST_BARCODES = [
    '8690504123456', // Coca Cola örnek
    '8690000000001', // Test ürün 1
    '8690000000002', // Test ürün 2
];

// Demo mode helper
export const isDemoMode = () => {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

// Vibration helper
export const vibrate = (pattern: number | number[] = 50) => {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

// Audio helper
export const playBeep = (frequency = 800, duration = 100) => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => oscillator.stop(), duration);
    } catch (error) {
        console.log('Audio not supported');
    }
};

// Format currency
export const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
    }).format(price);
};

// Check if low stock
export const isLowStock = (quantity: number, threshold = 10) => {
    return quantity < threshold;
};
