import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParcelaState } from './useParcelaState';

// addObject builds ids from Date.now(); make it monotonic so rapid adds in a
// test get distinct ids.
beforeEach(() => {
  let now = 1_000;
  vi.spyOn(Date, 'now').mockImplementation(() => (now += 1_000));
});
afterEach(() => vi.restoreAllMocks());

describe('useParcelaState', () => {
  it('adds an object, selects it, and snaps to the 0.5 m grid', () => {
    const { result } = renderHook(() => useParcelaState());
    let id = '';
    act(() => { id = result.current.addObject('casa_80', [1.2, 0.01, 2.7]); });

    expect(result.current.objects).toHaveLength(1);
    expect(result.current.selectedId).toBe(id);
    const o = result.current.objects[0];
    expect(o.position[0]).toBe(1.0); // 1.2 → 1.0
    expect(o.position[2]).toBe(2.5); // 2.7 → 2.5
  });

  it('rejects a colliding gizmo move but still applies rotation', () => {
    const { result } = renderHook(() => useParcelaState());
    let a = '', b = '';
    act(() => { a = result.current.addObject('casa_120', [0, 0, 0]); });
    act(() => { b = result.current.addObject('casa_120', [30, 0, 30]); });

    // Move B onto A (3 m apart < (4.5+4.5)*0.6) and rotate in the same commit
    act(() => { result.current.updateObject(b, { position: [3, 0, 0], rotation: 1.5 }); });
    const objB = result.current.objects.find((o) => o.id === b)!;
    expect(objB.position).toEqual([30, 0, 30]); // move rejected
    expect(objB.rotation).toBe(1.5);            // rotation still applied
    void a;
  });

  it('allows a non-colliding move', () => {
    const { result } = renderHook(() => useParcelaState());
    let b = '';
    act(() => { result.current.addObject('casa_120', [0, 0, 0]); });
    act(() => { b = result.current.addObject('casa_120', [30, 0, 30]); });
    act(() => { result.current.updateObject(b, { position: [50, 0, 50] }); });
    expect(result.current.objects.find((o) => o.id === b)!.position).toEqual([50, 0, 50]);
  });

  it('moveObject blocks a colliding destination', () => {
    const { result } = renderHook(() => useParcelaState());
    let b = '';
    act(() => { result.current.addObject('casa_120', [0, 0, 0]); });
    act(() => { b = result.current.addObject('casa_120', [40, 0, 0]); });
    act(() => { result.current.moveObject(b, [2, 0, 0]); }); // collides with A
    expect(result.current.objects.find((o) => o.id === b)!.position).toEqual([40, 0, 0]);
  });

  it('undo/redo restores the object set', () => {
    const { result } = renderHook(() => useParcelaState());
    act(() => { result.current.addObject('arbol_pino', [5, 0, 5]); });
    expect(result.current.canUndo).toBe(true);
    act(() => { result.current.undo(); });
    expect(result.current.objects).toHaveLength(0);
    expect(result.current.canRedo).toBe(true);
    act(() => { result.current.redo(); });
    expect(result.current.objects).toHaveLength(1);
  });

  it('clamps scale to [0.3, 3] on scaleSelected', () => {
    const { result } = renderHook(() => useParcelaState());
    act(() => { result.current.addObject('casa_80', [0, 0, 0]); }); // defaultScale 1
    act(() => { result.current.scaleSelected(5); });   // → clamp 3
    expect(result.current.objects[0].scale).toBe(3);
    act(() => { result.current.scaleSelected(-10); });  // → clamp 0.3
    expect(result.current.objects[0].scale).toBe(0.3);
  });

  it('rotateSelected accumulates rotation on the selected object', () => {
    const { result } = renderHook(() => useParcelaState());
    act(() => { result.current.addObject('casa_80', [0, 0, 0]); });
    act(() => { result.current.rotateSelected(Math.PI / 2); });
    act(() => { result.current.rotateSelected(Math.PI / 2); });
    expect(result.current.objects[0].rotation).toBeCloseTo(Math.PI, 5);
  });

  it('removes an object and clears its selection', () => {
    const { result } = renderHook(() => useParcelaState());
    let id = '';
    act(() => { id = result.current.addObject('quincho', [3, 0, 3]); });
    act(() => { result.current.removeObject(id); });
    expect(result.current.objects).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
  });

  it('serialises and restores the design via toJSON / loadFromJSON', () => {
    const { result } = renderHook(() => useParcelaState());
    act(() => { result.current.addObject('piscina', [2, 0, 2]); });
    act(() => { result.current.addObject('deck', [6, 0, 6]); });
    let json = '';
    act(() => { json = result.current.toJSON(); });

    const { result: r2 } = renderHook(() => useParcelaState());
    act(() => { r2.current.loadFromJSON(json); });
    expect(r2.current.objects).toHaveLength(2);
    expect(r2.current.objects.map((o) => o.type).sort()).toEqual(['deck', 'piscina']);
  });

  it('resetAll clears the scene (and is undoable)', () => {
    const { result } = renderHook(() => useParcelaState());
    act(() => { result.current.addObject('casa_50', [0, 0, 0]); });
    act(() => { result.current.resetAll(); });
    expect(result.current.objects).toHaveLength(0);
    act(() => { result.current.undo(); });
    expect(result.current.objects).toHaveLength(1);
  });
});
