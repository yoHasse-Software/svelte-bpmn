<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import BpmnModeler from 'bpmn-js/lib/Modeler';
	import { BpmnFileManager, debounce, type FileHandle } from '../utils/fileAccess';
	
	// Import additional modules for enhanced BPMN functionality
	import minimapModule from 'diagram-js-minimap';
	// import BpmnHelp from './BpmnHelp.svelte';
	
	import { 
		Save, 
		FolderOpen, 
		FileText, 
		Download, 
		Clock,
        CircleCheck,
        CircleAlert
	} from 'lucide-svelte';
	import { toaster } from '../toaster-svelte';


	let modelerContainer: HTMLDivElement;
	let modeler: any; // Will be BpmnModeler after dynamic import
	let fileManager = new BpmnFileManager();
	let isInitialized = false;
	let saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
	let lastSaveTime: string = '';
	// let statusMessage: string = '';

	// Reactive file info
	let fileInfo: FileHandle = fileManager.fileInfo;

	// Simple notification system
	function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
		if (type === 'success') {
			toaster.success({
				title: 'Success',
				description: message,
				duration: 3000,
			});
		} else if (type === 'error') {
			toaster.error({
				title: 'Error',
				description: message,
				duration: 3000,
			});
		} else {
			toaster.info({
				title: 'Info',
				description: message,
				duration: 3000,
			});
		}
		// statusMessage = message;
		// console.log(`[${type.toUpperCase()}] ${message}`);
		// setTimeout(() => {
		// 	statusMessage = '';
		// }, 3000);
	}

	// Default BPMN diagram
	const defaultDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" targetNamespace="http://bpmn.io/schema/bpmn" id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="173.0" y="102.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

	// Debounced auto-save function
	const debouncedAutoSave = debounce(async () => {
		if (!fileManager.fileInfo.handle) return;
		
		try {
			saveStatus = 'saving';
			const { xml } = await modeler.saveXML({ format: true });
			if (xml) {
				await fileManager.autoSave(xml);
				saveStatus = 'saved';
				lastSaveTime = new Date().toLocaleTimeString();
				fileInfo = fileManager.fileInfo;
				
				setTimeout(() => {
					if (saveStatus === 'saved') saveStatus = 'idle';
				}, 2000);
			}
		} catch (error) {
			saveStatus = 'error';
			console.error('Auto-save failed:', error);
		}
	}, 1000);



	onMount(async () => {
		
		try {
			// Initialize BPMN modeler with enhanced configuration
			modeler = new BpmnModeler({
				container: modelerContainer,
				keyboard: {
					bindTo: document
				},
				// Add minimap and ensure all BPMN elements are available
				additionalModules: [
					minimapModule
				]
			});

			// Load default diagram
			try {
				await modeler.importXML(defaultDiagram);
				isInitialized = true;
				
				// Setup auto-save on diagram changes
				modeler.on('commandStack.changed', () => {
					debouncedAutoSave();
				});

				// Log available palette entries for debugging
				const palette = modeler.get('palette');
				const contextPad = modeler.get('contextPad');
				const replacementProvider = modeler.get('replace');
				
				console.log('Available palette entries:', palette.getEntries());
				console.log('Context pad available:', !!contextPad);
				console.log('Replacement provider available:', !!replacementProvider);

				// Add instructions notification
				showNotification('BPMN Designer loaded successfully', 'success');

			} catch (error) {
				console.error('Failed to load default diagram:', error);
				showNotification('Failed to initialize BPMN Designer', 'error');
			}
		} catch (error) {
			console.error('Failed to load BPMN.js:', error);
			showNotification('Failed to load BPMN Designer', 'error');
		}
	});

	onDestroy(() => {
		if (modeler) {
			modeler.destroy();
		}
	});

	async function openFile() {
		try {
			const content = await fileManager.openFile();
			await modeler.importXML(content);
			fileInfo = fileManager.fileInfo;
			saveStatus = 'idle';
			
			showNotification(`Opened ${fileInfo.name}`, 'success');
		} catch (error: any) {
			showNotification(error.message || 'Failed to open file', 'error');
		}
	}

	async function saveFile(saveAs: boolean = false) {
		try {
			saveStatus = 'saving';
			const { xml } = await modeler.saveXML({ format: true });
			if (xml) {
				await fileManager.saveFile(xml, saveAs);
				saveStatus = 'saved';
				lastSaveTime = new Date().toLocaleTimeString();
				fileInfo = fileManager.fileInfo;
				
				showNotification(`Saved ${fileInfo.name}`, 'success');

				setTimeout(() => {
					if (saveStatus === 'saved') saveStatus = 'idle';
				}, 2000);
			}
		} catch (error: any) {
			saveStatus = 'error';
			showNotification(error.message || 'Failed to save file', 'error');
		}
	}

	async function newFile() {
		try {
			fileManager.newFile();
			await modeler.importXML(defaultDiagram);
			fileInfo = fileManager.fileInfo;
			saveStatus = 'idle';
			
			showNotification('Created new BPMN diagram', 'success');
		} catch (error: any) {
			showNotification('Failed to create new file', 'error');
		}
	}

	function getSaveStatusIcon() {
		switch (saveStatus) {
			case 'saving':
				return Clock;
			case 'saved':
				return CircleCheck;
			case 'error':
				return CircleAlert;
			default:
				return Save;
		}
	}

	function getSaveStatusColor() {
		switch (saveStatus) {
			case 'saving':
				return 'text-warning-500';
			case 'saved':
				return 'text-success-500';
			case 'error':
				return 'text-error-500';
			default:
				return 'text-surface-500';
		}
	}
</script>

<div class="h-full flex flex-col">
	<!-- Toolbar -->
	<div class="bg-surface-100-800-token border-b border-surface-300-600-token p-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<button
					class="btn btn-sm variant-filled-primary"
					on:click={newFile}
					title="New File"
				>
					<FileText size={16} />
					<span class="hidden sm:inline">New</span>
				</button>
				
				<button
					class="btn btn-sm variant-filled-secondary"
					on:click={openFile}
					title="Open File"
				>
					<FolderOpen size={16} />
					<span class="hidden sm:inline">Open</span>
				</button>
				
				<button
					class="btn btn-sm variant-filled-tertiary"
					on:click={() => saveFile(false)}
					disabled={saveStatus === 'saving'}
					title="Save"
				>
					<svelte:component this={getSaveStatusIcon()} size={16} class={getSaveStatusColor()} />
					<span class="hidden sm:inline">Save</span>
				</button>
				
				<button
					class="btn btn-sm variant-filled-surface"
					on:click={() => saveFile(true)}
					disabled={saveStatus === 'saving'}
					title="Save As"
				>
					<Download size={16} />
					<span class="hidden sm:inline">Save As</span>
				</button>
			</div>

			<!-- File info and save status -->
			<div class="flex items-center gap-4 text-sm">
				{#if fileInfo.name}
					<div class="flex items-center gap-2">
						<span class="text-surface-600-300-token">File:</span>
						<span class="font-medium">{fileInfo.name}</span>
					</div>
				{/if}
				
				{#if lastSaveTime}
					<div class="flex items-center gap-2">
						<span class="text-surface-600-300-token">Last saved:</span>
						<span class="text-sm">{lastSaveTime}</span>
					</div>
				{/if}
				
				{#if saveStatus === 'saving'}
					<div class="flex items-center gap-2 text-warning-500">
						<Clock size={16} class="animate-spin" />
						<span>Saving...</span>
					</div>
				{:else if saveStatus === 'saved'}
					<div class="flex items-center gap-2 text-success-500">
						<CircleCheck size={16} />
						<span>Saved</span>
					</div>
				{:else if saveStatus === 'error'}
					<div class="flex items-center gap-2 text-error-500">
						<CircleAlert size={16} />
						<span>Save failed</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- File System Access API support notice -->
		{#if !fileManager.isSupported}
			<div class="mt-2 p-2 bg-warning-100 dark:bg-warning-900 border border-warning-300 dark:border-warning-700 rounded-container-token">
				<div class="flex items-center gap-2 text-warning-700 dark:text-warning-300">
					<CircleAlert size={16} />
					<span class="text-sm">
						Your browser doesn't support automatic file saving. Files will be downloaded instead.
					</span>
				</div>
			</div>
		{/if}

	</div>

	<!-- BPMN Modeler Container -->
	<div class="flex-1 relative overflow-hidden w-full">
		<div
			bind:this={modelerContainer}
			class="absolute inset-0 bg-white"
		></div>
		
		{#if !isInitialized}
			<div class="absolute inset-0 flex items-center justify-center bg-surface-50-900-token">
				<div class="text-center">
					<div class="animate-pulse text-primary-500 mb-4">
						<Clock size={48} />
					</div>
					<p class="text-lg font-medium">Loading BPMN Designer...</p>
				</div>
			</div>
		{/if}

		<!-- Help Component -->
		<!-- <BpmnHelp /> -->
	</div>
</div>

<style>
	:global(.bjs-container) {
		height: 100% !important;
	}
	
	:global(.djs-container) {
		font-family: inherit !important;
	}
	
	:global(.bpmn-icon-start-event-none) {
		fill: rgb(var(--color-primary-500)) !important;
	}
	
	:global(.bpmn-icon-end-event-none) {
		fill: rgb(var(--color-error-500)) !important;
	}
	
	:global(.bpmn-icon-task) {
		fill: rgb(var(--color-secondary-500)) !important;
	}
	
	:global(.bpmn-icon-gateway-none) {
		fill: rgb(var(--color-tertiary-500)) !important;
	}
</style>
