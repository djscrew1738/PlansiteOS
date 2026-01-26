/**
 * Unit Tests for CircuitBreaker
 *
 * Tests the circuit breaker pattern implementation for fault tolerance.
 */

const CircuitBreaker = require('../../utils/CircuitBreaker');

describe('CircuitBreaker', () => {
  let breaker;
  let mockFunction;

  beforeEach(() => {
    mockFunction = jest.fn();
    breaker = new CircuitBreaker(mockFunction, {
      threshold: 3,
      timeout: 1000,
      resetTimeout: 100
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CLOSED state (normal operation)', () => {
    it('should execute function successfully', async () => {
      mockFunction.mockResolvedValue('success');

      const result = await breaker.call('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should pass through function errors', async () => {
      mockFunction.mockRejectedValue(new Error('Function failed'));

      await expect(breaker.call()).rejects.toThrow('Function failed');
      expect(breaker.failures).toBe(1);
    });
  });

  describe('OPEN state (circuit tripped)', () => {
    beforeEach(async () => {
      // Trip the circuit by hitting threshold
      mockFunction.mockRejectedValue(new Error('Fail'));

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.call();
        } catch (e) {
          // Expected
        }
      }
    });

    it('should transition to OPEN after threshold failures', () => {
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reject immediately without calling function', async () => {
      mockFunction.mockClear();

      await expect(breaker.call()).rejects.toThrow('Circuit breaker is OPEN');
      expect(mockFunction).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(breaker.getState()).toBe('HALF_OPEN');
    });
  });

  describe('HALF_OPEN state (testing recovery)', () => {
    beforeEach(async () => {
      // Trip circuit and wait for HALF_OPEN
      mockFunction.mockRejectedValue(new Error('Fail'));

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.call();
        } catch (e) {
          // Expected
        }
      }

      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('should allow single test request', async () => {
      mockFunction.mockClear();
      mockFunction.mockResolvedValue('success');

      const result = await breaker.call();

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should return to CLOSED on success', async () => {
      mockFunction.mockResolvedValue('success');

      await breaker.call();

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.failures).toBe(0);
    });

    it('should return to OPEN on failure', async () => {
      mockFunction.mockRejectedValue(new Error('Still failing'));

      await expect(breaker.call()).rejects.toThrow('Still failing');
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('metrics', () => {
    it('should track success count', async () => {
      mockFunction.mockResolvedValue('ok');

      await breaker.call();
      await breaker.call();

      const stats = breaker.getStats();
      expect(stats.successCount).toBe(2);
    });

    it('should track failure count', async () => {
      mockFunction.mockRejectedValue(new Error('fail'));

      try { await breaker.call(); } catch (e) {}
      try { await breaker.call(); } catch (e) {}

      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(2);
    });

    it('should track circuit open count', async () => {
      mockFunction.mockRejectedValue(new Error('fail'));

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try { await breaker.call(); } catch (e) {}
      }

      // Try to call while open
      try { await breaker.call(); } catch (e) {}

      const stats = breaker.getStats();
      expect(stats.openCount).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle synchronous exceptions', async () => {
      const syncBreaker = new CircuitBreaker(() => {
        throw new Error('Sync error');
      });

      await expect(syncBreaker.call()).rejects.toThrow('Sync error');
    });

    it('should handle null return values', async () => {
      mockFunction.mockResolvedValue(null);

      const result = await breaker.call();
      expect(result).toBeNull();
    });

    it('should reset failure count on success', async () => {
      mockFunction.mockRejectedValue(new Error('fail'));
      try { await breaker.call(); } catch (e) {}

      expect(breaker.failures).toBe(1);

      mockFunction.mockResolvedValue('success');
      await breaker.call();

      expect(breaker.failures).toBe(0);
    });
  });
});
