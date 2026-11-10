/** Agrupa eventos de arrastre en un render por frame; flush final síncrono. */
export function createRenderScheduler(
  render: () => void,
  request: (callback: FrameRequestCallback) => number = requestAnimationFrame,
  cancelFrame: (id: number) => void = cancelAnimationFrame,
) {
  let frame: number | null = null;

  return {
    schedule(): void {
      if (frame !== null) return;
      frame = request(() => {
        frame = null;
        render();
      });
    },
    flush(): void {
      if (frame === null) return;
      cancelFrame(frame);
      frame = null;
      render();
    },
    cancel(): void {
      if (frame === null) return;
      cancelFrame(frame);
      frame = null;
    },
  };
}
