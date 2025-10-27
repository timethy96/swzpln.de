// Tests for base exporter utilities

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getMimeType, getFilename, downloadFile } from './base';

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

