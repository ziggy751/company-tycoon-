import {expect,it} from 'vitest';
import {DEFAULT_KEYS,assignKey,normalizeControls} from './controls';
it('allows ordinary keyboard bindings, rejects collisions and keeps system Escape reserved',()=>{expect(assignKey(DEFAULT_KEYS,'interact','KeyF').interact).toBe('KeyF');expect(()=>assignKey(DEFAULT_KEYS,'interact','KeyW')).toThrow('assigned');expect(()=>assignKey(DEFAULT_KEYS,'interact','Escape')).toThrow('reserved');});
it('bounds sensitivity and safely restores incomplete legacy preferences',()=>{expect(normalizeControls({}).keys).toEqual(DEFAULT_KEYS);expect(normalizeControls({zoomSensitivity:99,damping:-1}).zoomSensitivity).toBe(2);expect(normalizeControls({zoomSensitivity:NaN}).zoomSensitivity).toBe(.6);});
