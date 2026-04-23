import CircuitBreaker from 'opossum';
import logger from '../config/logger.config';

const breakerOptions = {
    timeout: 3000, // Nếu request chạy lâu hơn 3s => fail
    errorThresholdPercentage: 50, // Nếu > 50% request fail => open circuit
    resetTimeout: 30000, // Sau 30s thử lại
};

export class CircuitBreakerWrapper {
    private breaker: CircuitBreaker;

    constructor(action: (...args: any[]) => Promise<any>, name: string, fallback?: (...args: any[]) => any) {
        this.breaker = new CircuitBreaker(action, breakerOptions);

        if (fallback) {
            this.breaker.fallback(fallback);
        }

        this.breaker.on('open', () => logger.warn(`[CIRCUIT_BREAKER] 🛑 ${name} OPENED`));
        this.breaker.on('halfOpen', () => logger.warn(`[CIRCUIT_BREAKER] ⚠️ ${name} HALF_OPEN`));
        this.breaker.on('close', () => logger.info(`[CIRCUIT_BREAKER] ✅ ${name} CLOSED`));
        this.breaker.on('fallback', () => logger.warn(`[CIRCUIT_BREAKER] 🔄 ${name} FALLBACK TRIGGERED`));
    }

    public async fire(...args: any[]): Promise<any> {
        return this.breaker.fire(...args);
    }
}
