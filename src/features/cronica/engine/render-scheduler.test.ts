import { describe, expect, it, vi } from 'vitest';
import { createRenderScheduler } from './render-scheduler';

function makeFrameControl() {
  const pending = new Map<number, FrameRequestCallback>();
  let next = 0;
  const request = vi.fn((callback: FrameRequestCallback) => {
    const id = ++next;
    pending.set(id, callback);
    return id;
  });
  const cancel = vi.fn((id: number) => { pending.delete(id); });
  return { pending, request, cancel };
}

describe('render por frame del arrastre', () => {
  it('coalescea ráfagas en un único dibujo por frame', () => {
    const frames = makeFrameControl();
    const render = vi.fn();
    const scheduler = createRenderScheduler(render, frames.request, frames.cancel);
    for (let i = 0; i < 30; i++) scheduler.schedule();
    expect(frames.request).toHaveBeenCalledOnce();
    expect(render).not.toHaveBeenCalled();
    frames.pending.get(1)?.(0);
    expect(render).toHaveBeenCalledOnce();
    scheduler.schedule();
    expect(frames.request).toHaveBeenCalledTimes(2);
  });

  it('flush completa el último movimiento y cancela el frame duplicado', () => {
    const frames = makeFrameControl();
    const render = vi.fn();
    const scheduler = createRenderScheduler(render, frames.request, frames.cancel);
    scheduler.schedule();
    scheduler.flush();
    expect(render).toHaveBeenCalledOnce();
    expect(frames.cancel).toHaveBeenCalledExactlyOnceWith(1);
    scheduler.flush();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('cancel elimina un dibujo pendiente antes de exportar', () => {
    const frames = makeFrameControl();
    const render = vi.fn();
    const scheduler = createRenderScheduler(render, frames.request, frames.cancel);
    scheduler.schedule();
    scheduler.cancel();
    expect(frames.pending.size).toBe(0);
    expect(render).not.toHaveBeenCalled();
  });
});
