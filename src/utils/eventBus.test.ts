import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from '../utils/eventBus';

describe('eventBus', () => {
  beforeEach(() => {
    // Очищаем все слушатели перед каждым тестом
    eventBus.removeAllListeners();
  });

  it('should emit and listen to events', async () => {
    const listener = vi.fn();
    eventBus.on('test:event', listener);
    eventBus.emit('test:event', { data: 'test' });
    expect(listener).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should call once listener only once', async () => {
    const listener = vi.fn();
    eventBus.once('once:event', listener);
    eventBus.emit('once:event', 'first');
    eventBus.emit('once:event', 'second');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('first');
  });

  it('should remove listener with off method', async () => {
    const listener = vi.fn();
    eventBus.on('cleanup:event', listener);
    eventBus.emit('cleanup:event', 'before');
    eventBus.off('cleanup:event', listener);
    eventBus.emit('cleanup:event', 'after');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('before');
  });

  it('should remove listener with off method', async () => {
    const listener = vi.fn();
    eventBus.on('off:event', listener);
    eventBus.emit('off:event', 'before');
    eventBus.off('off:event', listener);
    eventBus.emit('off:event', 'after');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('before');
  });

  it('should pass multiple arguments to listeners', async () => {
    const listener = vi.fn();
    eventBus.on('multi:event', listener);
    eventBus.emit('multi:event', 'arg1', 'arg2', { arg3: true });
    expect(listener).toHaveBeenCalledWith('arg1', 'arg2', { arg3: true });
  });

  it('should handle multiple listeners for the same event', async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    eventBus.on('multi:listener', listener1);
    eventBus.on('multi:listener', listener2);
    eventBus.emit('multi:listener', 'data');
    expect(listener1).toHaveBeenCalledWith('data');
    expect(listener2).toHaveBeenCalledWith('data');
  });

  it('should handle multiple events correctly', async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    eventBus.on('event1', listener1);
    eventBus.on('event2', listener2);
    eventBus.emit('event1', 'data1');
    eventBus.emit('event2', 'data2');
    expect(listener1).toHaveBeenCalledWith('data1');
    expect(listener1).not.toHaveBeenCalledWith('data2');
    expect(listener2).toHaveBeenCalledWith('data2');
    expect(listener2).not.toHaveBeenCalledWith('data1');
  });
});
