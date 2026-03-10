// Tests for base exporter utilities

import { describe, it, expect } from 'vitest';
import { getMimeType, getFilename } from './base';

describe('base exporter', () => {
	describe('getMimeType', () => {
		it('should return correct mime type for dxf', () => {
			expect(getMimeType('dxf')).toBe('application/dxf');
		});

		it('should return correct mime type for svg', () => {
			expect(getMimeType('svg')).toBe('image/svg+xml');
		});

		it('should return correct mime type for pdf', () => {
			expect(getMimeType('pdf')).toBe('application/pdf');
		});

		it('should return correct mime type for ifc', () => {
			expect(getMimeType('ifc')).toBe('application/x-step');
		});

		it('should return correct mime type for dxf3d', () => {
			expect(getMimeType('dxf3d')).toBe('application/dxf');
		});

		it('should return correct mime type for obj', () => {
			expect(getMimeType('obj')).toBe('model/obj');
		});
	});

	describe('getFilename', () => {
		it('should return correct filename for dxf', () => {
			expect(getFilename('dxf')).toBe('swzpln.dxf');
		});

		it('should return correct filename for svg', () => {
			expect(getFilename('svg')).toBe('swzpln.svg');
		});

		it('should return correct filename for pdf', () => {
			expect(getFilename('pdf')).toBe('swzpln.pdf');
		});

		it('should return correct filename for ifc', () => {
			expect(getFilename('ifc')).toBe('swzpln.ifc');
		});

		it('should return correct filename for dxf3d', () => {
			expect(getFilename('dxf3d')).toBe('swzpln.dxf');
		});

		it('should return correct filename for obj', () => {
			expect(getFilename('obj')).toBe('swzpln.obj');
		});
	});

	// Note: downloadFile tests are skipped in server environment as they require DOM
	// These would need to be tested in a browser environment or with JSDOM
	describe.skip('downloadFile (requires browser)', () => {
		it('should trigger download for string content', () => {
			// This test requires a browser DOM
			expect(true).toBe(true);
		});

		it('should trigger download for blob content', () => {
			// This test requires a browser DOM
			expect(true).toBe(true);
		});

		it('should handle blob URLs directly', () => {
			// This test requires a browser DOM
			expect(true).toBe(true);
		});
	});
});
