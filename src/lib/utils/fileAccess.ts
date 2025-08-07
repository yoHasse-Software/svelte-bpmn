/**
 * File System Access API utilities for BPMN file handling
 */

// Extend Window interface for File System Access API
declare global {
	interface Window {
		showOpenFilePicker?: (options?: any) => Promise<FileSystemFileHandle[]>;
		showSaveFilePicker?: (options?: any) => Promise<FileSystemFileHandle>;
	}
}

export interface FileHandle {
	handle: FileSystemFileHandle | null;
	name: string;
	lastSaved: Date | null;
}

export class BpmnFileManager {
	private fileHandle: FileSystemFileHandle | null = null;
	private fileName: string = 'untitled.bpmn';
	private lastSaved: Date | null = null;

	/**
	 * Check if File System Access API is supported
	 */
	get isSupported(): boolean {
		return typeof window !== 'undefined' && 
			'showOpenFilePicker' in window && 
			'showSaveFilePicker' in window;
	}

	/**
	 * Get current file info
	 */
	get fileInfo(): FileHandle {
		return {
			handle: this.fileHandle,
			name: this.fileName,
			lastSaved: this.lastSaved
		};
	}

	/**
	 * Open and load a BPMN file
	 */
	async openFile(): Promise<string> {
		if (!this.isSupported) {
			throw new Error('File System Access API not supported');
		}

		try {
			const [fileHandle] = await window.showOpenFilePicker!({
				types: [
					{
						description: 'BPMN files',
						accept: {
							'application/xml': ['.bpmn', '.xml']
						}
					}
				]
			});

			const file = await fileHandle.getFile();
			const content = await file.text();

			this.fileHandle = fileHandle;
			this.fileName = file.name;
			this.lastSaved = new Date(file.lastModified);

			return content;
		} catch (error: any) {
			if (error?.name === 'AbortError') {
				throw new Error('File selection cancelled');
			}
			throw new Error(`Failed to open file: ${error?.message || 'Unknown error'}`);
		}
	}

	/**
	 * Save BPMN content to file
	 */
	async saveFile(content: string, saveAs: boolean = false): Promise<void> {
		if (!this.isSupported) {
			// Fallback: download file
			this.downloadFile(content);
			return;
		}

		try {
			// If no file handle or saveAs is requested, show save picker
			if (!this.fileHandle || saveAs) {
				this.fileHandle = await window.showSaveFilePicker!({
					suggestedName: this.fileName,
					types: [
						{
							description: 'BPMN files',
							accept: {
								'application/xml': ['.bpmn']
							}
						}
					]
				});
				this.fileName = this.fileHandle.name;
			}

			// Write to file
			const writable = await this.fileHandle!.createWritable();
			await writable.write(content);
			await writable.close();

			this.lastSaved = new Date();
		} catch (error: any) {
			if (error?.name === 'AbortError') {
				throw new Error('Save cancelled');
			}
			throw new Error(`Failed to save file: ${error?.message || 'Unknown error'}`);
		}
	}

	/**
	 * Auto-save function for frequent saves
	 */
	async autoSave(content: string): Promise<void> {
		if (!this.fileHandle) {
			return; // Can't auto-save without a file handle
		}

		try {
			const writable = await this.fileHandle.createWritable();
			await writable.write(content);
			await writable.close();
			this.lastSaved = new Date();
		} catch (error: any) {
			console.error('Auto-save failed:', error);
			throw new Error(`Auto-save failed: ${error?.message || 'Unknown error'}`);
		}
	}

	/**
	 * Save SVG content to file
	 */
	async saveSVGFile(content: string, filename: string, saveAs: boolean = false): Promise<void> {
		if (!this.isSupported) {
			// Fallback: download file
			this.downloadSVGFile(content, filename);
			return;
		}

		try {
			const fileHandle = await window.showSaveFilePicker!({
				suggestedName: filename,
				types: [
					{
						description: 'SVG files',
						accept: {
							'image/svg+xml': ['.svg']
						}
					}
				]
			});

			// Write to file
			const writable = await fileHandle.createWritable();
			await writable.write(content);
			await writable.close();
		} catch (error: any) {
			if (error?.name === 'AbortError') {
				throw new Error('Save cancelled');
			}
			throw new Error(`Failed to save SVG file: ${error?.message || 'Unknown error'}`);
		}
	}

	/**
	 * Fallback download method for SVG files
	 */
	private downloadSVGFile(content: string, filename: string): void {
		const blob = new Blob([content], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	/**
	 * Fallback download method for unsupported browsers
	 */
	private downloadFile(content: string): void {
		const blob = new Blob([content], { type: 'application/xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = this.fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		this.lastSaved = new Date();
	}

	/**
	 * Create a new file
	 */
	newFile(): void {
		this.fileHandle = null;
		this.fileName = 'untitled.bpmn';
		this.lastSaved = null;
	}
}

/**
 * Debounce utility for auto-save
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: number;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait) as any;
	};
}
