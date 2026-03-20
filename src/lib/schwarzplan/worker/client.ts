// Worker client wrapper for type-safe communication

import type {
	Bounds,
	ExportFormat,
	GeoDataResponse,
	Layer,
	OSMData,
	ProgressCallback,
	WorkerMessage,
	WorkerRequest
} from '../types';
import * as m from '$lib/paraglide/messages';

export class SchwarzplanWorker {
	private worker: Worker | null = null;
	private currentProgress?: ProgressCallback;

	/**
	 * Initialize the worker
	 */
	private ensureWorker(): Worker {
		if (!this.worker) {
			// Vite will handle the worker bundling
			this.worker = new Worker(new URL('./schwarzplan.worker.ts', import.meta.url), {
				type: 'module'
			});

			this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
				this.handleMessage(event.data);
			};

			this.worker.onerror = (error) => {
				console.error('Worker error:', error);
				this.currentProgress?.({
					step: 'error',
					message: m.error_worker()
				});
			};
		}

		return this.worker;
	}

	/**
	 * Handle messages from worker
	 */
	private handleMessage(message: WorkerMessage): void {
		switch (message.type) {
			case 'progress':
				this.currentProgress?.(message.data);
				break;

			case 'complete':
				this.currentProgress?.({
					step: 'complete',
					percent: 100,
					message: m.error_generation_complete()
				});
				break;

			case 'error':
				this.currentProgress?.({
					step: 'error',
					message: message.error
				});
				break;
		}
	}

	/**
	 * Generate schwarzplan in the requested format
	 */
	async generate(
		format: ExportFormat,
		osmData: OSMData | null,
		geodata: GeoDataResponse | null,
		elevationMatrix: number[][] | null,
		bounds: Bounds,
		layers: Layer[],
		zoom: number,
		scale: number | undefined,
		onProgress?: ProgressCallback,
		contourInterval?: number,
		buildingStyle?: 'filled' | 'outline'
	): Promise<string> {
		return new Promise((resolve, reject) => {
			this.currentProgress = onProgress;

			const worker = this.ensureWorker();

			// Set up one-time message handler for completion
			const handleCompletion = (event: MessageEvent<WorkerMessage>) => {
				const message = event.data;

				if (message.type === 'complete') {
					worker.removeEventListener('message', handleCompletion);
					this.currentProgress = undefined;
					resolve(message.data as string);
				} else if (message.type === 'error') {
					worker.removeEventListener('message', handleCompletion);
					this.currentProgress = undefined;
					reject(new Error(message.error));
				}
			};

			worker.addEventListener('message', handleCompletion);

			// Send request to worker
			const request: WorkerRequest = {
				type: 'generate',
				format,
				osmData,
				geodata,
				elevationMatrix,
				bounds,
				layers,
				zoom,
				scale,
				contourInterval,
				buildingStyle
			};

			worker.postMessage(request);
		});
	}

	/**
	 * Cancel current generation and terminate worker
	 */
	cancel(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
			this.currentProgress?.({
				step: 'error',
				message: m.error_generation_cancelled()
			});
			this.currentProgress = undefined;
		}
	}

	/**
	 * Clean up worker
	 */
	destroy(): void {
		this.cancel();
	}
}
