import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, LogLevel } from '../../src/utils/logger.js';

describe('Logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('log level filtering', () => {
    it('should filter debug messages at default (info) level', () => {
      const logger = new Logger();
      logger.debug('hidden');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should show info messages at default level', () => {
      const logger = new Logger();
      logger.info('visible');
      expect(logSpy).toHaveBeenCalledWith('visible');
    });

    it('should show warn messages at default level', () => {
      const logger = new Logger();
      logger.warn('caution');
      expect(warnSpy).toHaveBeenCalledWith('caution');
    });

    it('should show error messages at default level', () => {
      const logger = new Logger();
      logger.error('failure');
      expect(errorSpy).toHaveBeenCalledWith('failure');
    });

    it('should show debug messages when level is debug', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug('trace info');
      expect(logSpy).toHaveBeenCalledWith('trace info');
    });

    it('should hide info messages when level is warn', () => {
      const logger = new Logger({ level: LogLevel.WARN });
      logger.info('hidden');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should hide warn messages when level is error', () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      logger.warn('hidden');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('output streams', () => {
    it('should route info to console.log', () => {
      const logger = new Logger();
      logger.info('to stdout');
      expect(logSpy).toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should route debug to console.log', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug('to stdout');
      expect(logSpy).toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should route warn to console.warn', () => {
      const logger = new Logger();
      logger.warn('to stderr');
      expect(warnSpy).toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should route error to console.error', () => {
      const logger = new Logger();
      logger.error('to stderr');
      expect(errorSpy).toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('silent mode', () => {
    it('should suppress all output in silent mode', () => {
      const logger = new Logger({ silent: true });
      logger.debug('nope');
      logger.info('nope');
      logger.warn('nope');
      logger.error('nope');
      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should be activatable after construction', () => {
      const logger = new Logger();
      logger.setSilent(true);
      logger.info('suppressed');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should be deactivatable', () => {
      const logger = new Logger({ silent: true });
      logger.setSilent(false);
      logger.info('now visible');
      expect(logSpy).toHaveBeenCalledWith('now visible');
    });
  });

  describe('capture mode', () => {
    it('should capture log calls in an array', () => {
      const logger = new Logger({ silent: true });
      const captured = logger.capture();
      logger.info('first');
      logger.warn('second');
      logger.error('third');
      expect(captured).toHaveLength(3);
      expect(captured[0]).toEqual({ level: 'info', message: 'first' });
      expect(captured[1]).toEqual({ level: 'warn', message: 'second' });
      expect(captured[2]).toEqual({ level: 'error', message: 'third' });
    });

    it('should clear captured logs', () => {
      const logger = new Logger({ silent: true });
      const captured = logger.capture();
      logger.info('one');
      expect(captured).toHaveLength(1);
      logger.clearCapture();
      expect(captured).toHaveLength(0);
    });

    it('should stop capturing after stopCapture', () => {
      const logger = new Logger({ silent: true });
      const captured = logger.capture();
      logger.info('caught');
      logger.stopCapture();
      logger.info('not caught');
      expect(captured).toHaveLength(1);
    });
  });

  describe('verbose environment variable', () => {
    const originalEnv = process.env.GRSPEC_VERBOSE;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.GRSPEC_VERBOSE;
      } else {
        process.env.GRSPEC_VERBOSE = originalEnv;
      }
    });

    it('should enable debug level when GRSPEC_VERBOSE=1', () => {
      process.env.GRSPEC_VERBOSE = '1';
      const logger = Logger.fromEnvironment();
      logger.debug('verbose debug');
      expect(logSpy).toHaveBeenCalledWith('verbose debug');
    });
  });

  describe('default instance', () => {
    it('should export a default logger instance', async () => {
      const { logger } = await import('../../src/utils/logger.js');
      expect(logger).toBeInstanceOf(Logger);
    });
  });
});
