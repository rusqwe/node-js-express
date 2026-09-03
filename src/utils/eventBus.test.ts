import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from '../utils/eventBus';

describe('eventBus', () => {
  beforeEach(() => {
    // Очищаем все слушатели перед каждым тестом
    eventBus.removeAllListeners();
  });

  it('должен отправлять и слушать события', async () => {
    const listener = vi.fn();
    eventBus.on('test:event', listener);
    eventBus.emit('test:event', { data: 'test' });
    expect(listener).toHaveBeenCalledWith({ data: 'test' });
  });

  it('должен вызывать once listener только один раз', async () => {
    const listener = vi.fn();
    eventBus.once('once:event', listener);
    eventBus.emit('once:event', 'first');
    eventBus.emit('once:event', 'second');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('first');
  });

  it('должен удалять listener методом off', async () => {
    const listener = vi.fn();
    eventBus.on('cleanup:event', listener);
    eventBus.emit('cleanup:event', 'before');
    eventBus.off('cleanup:event', listener);
    eventBus.emit('cleanup:event', 'after');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('before');
  });

  it('должен удалять listener через off', async () => {
    const listener = vi.fn();
    eventBus.on('off:event', listener);
    eventBus.emit('off:event', 'before');
    eventBus.off('off:event', listener);
    eventBus.emit('off:event', 'after');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('before');
  });

  it('передаёт несколько аргументов listener', async () => {
    const listener = vi.fn();
    eventBus.on('multi:event', listener);
    eventBus.emit('multi:event', 'arg1', 'arg2', { arg3: true });
    expect(listener).toHaveBeenCalledWith('arg1', 'arg2', { arg3: true });
  });

  it('должен обрабатывать несколько listener для одного события', async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    eventBus.on('multi:listener', listener1);
    eventBus.on('multi:listener', listener2);
    eventBus.emit('multi:listener', 'data');
    expect(listener1).toHaveBeenCalledWith('data');
    expect(listener2).toHaveBeenCalledWith('data');
  });

  it('должен корректно обрабатывать несколько событий', async () => {
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
