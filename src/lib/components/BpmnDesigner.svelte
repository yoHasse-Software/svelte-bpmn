<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import BpmnModeler from 'bpmn-js/lib/Modeler';
	import { BpmnFileManager, debounce, type FileHandle } from '../utils/fileAccess';
	import JSZip from 'jszip';
	import { navigationTemplate } from '../templates/navigationTemplate';
	import { simpleNavigationTemplate } from '../templates/simpleNavigationTemplate';
	
	// Remove minimap temporarily due to deprecated API warnings
	// import minimapModule from 'diagram-js-minimap';
	// import BpmnHelp from './BpmnHelp.svelte';
	
	import { 
		Save, 
		FolderOpen, 
		FileText, 
		Download, 
		Clock,
        CircleCheck,
        CircleAlert,
        CircleQuestionMark,
        Image,
        Images
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
	}

	function showHelp() {
		showNotification('💡 To access all BPMN elements: Click any element → Look for the wrench icon (🔧) → Click it to see Message Events, Service Tasks, etc.\n\n📸 SVG Export: Use "Export SVG" for current view or "Export Each" to download a ZIP file with main process and each subprocess as separate SVG files!', 'info');
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
				}
				// Minimap removed temporarily due to deprecated API warnings
				// additionalModules: [
				// 	minimapModule
				// ]
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
				const replace = modeler.get('replace');
				
				console.log('Available palette entries:', Object.keys(palette.getEntries()));
				console.log('Context pad available:', !!contextPad);
				console.log('Replace provider available:', !!replace);

				// Log information about accessing more elements
				console.log('%c🔧 To access all BPMN elements:', 'color: #4f46e5; font-weight: bold');
				console.log('1. Click on any element to select it');
				console.log('2. Look for the wrench icon (🔧) that appears');
				console.log('3. Click the wrench to see ALL available element types');
				console.log('4. This includes Message Start Events, Timer Events, Service Tasks, etc.');

				// Add instructions notification
				showNotification('BPMN Designer loaded successfully', 'success');
				setTimeout(() => {
					showNotification('💡 Click any element, then use the wrench icon (🔧) to access all BPMN element types!', 'info');
				}, 2000);

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

	async function exportSVG(includeSubprocesses: boolean = false, useSimpleTemplate: boolean = false) {
		try {
			if (includeSubprocesses) {
				// Export all subprocesses by first expanding them
				await exportAllSubprocessesSVG(useSimpleTemplate);
			} else {
				// Export current view only
				await exportCurrentViewSVG();
			}
		} catch (error: any) {
			showNotification(error.message || 'Failed to export SVG', 'error');
		}
	}

	async function exportCurrentViewSVG() {
		try {
			const { svg } = await modeler.saveSVG();
			downloadSVG(svg, `${getBaseFileName()}.svg`);
			showNotification('SVG exported successfully', 'success');
		} catch (error: any) {
			throw new Error(`Failed to export current view: ${error.message}`);
		}
	}

	async function exportAllSubprocessesSVG(useSimpleTemplate: boolean = false) {
		try {
			showNotification('Exporting main process and all subprocesses...', 'info');
			
			const elementRegistry = modeler.get('elementRegistry');
			const zip = new JSZip();
			const svgData: { filename: string; title: string; content: string }[] = [];
			
			// First, export the main process (current view)
			const { svg: mainSvg } = await modeler.saveSVG();
			const mainFilename = `${getBaseFileName()}_main_process.svg`;
			zip.file(mainFilename, mainSvg);
			svgData.push({ filename: mainFilename, title: 'Main Process', content: mainSvg });
			
			// Find all subprocesses (both expanded and collapsed)
			const subprocesses = elementRegistry.filter((element: any) => {
				return element.type === 'bpmn:SubProcess';
			});

			if (subprocesses.length === 0) {
				showNotification('No subprocesses found. Only main process exported.', 'info');
				downloadSVG(mainSvg, `${getBaseFileName()}.svg`);
				return;
			}

			// Export each subprocess separately without modifying the main view
			for (let i = 0; i < subprocesses.length; i++) {
				const subprocess = subprocesses[i];
				const svgContent = await exportSubprocessSVGContent(subprocess, i + 1);
				if (svgContent) {
					const subprocessName = subprocess.businessObject?.name || `subprocess_${i + 1}`;
					const filename = `${getBaseFileName()}_${sanitizeFilename(subprocessName)}.svg`;
					zip.file(filename, svgContent);
					svgData.push({ 
						filename: filename, 
						title: subprocess.businessObject?.name || `Subprocess ${i + 1}`,
						content: svgContent
					});
				}
			}
			
			// Create index.html for navigation using the selected template
			const indexHtml = useSimpleTemplate 
				? createSimpleNavigationHTML(svgData, getBaseFileName())
				: createNavigationHTML(svgData, getBaseFileName());
			zip.file('index.html', indexHtml);
			
			// Generate and download the ZIP file
			const templateType = useSimpleTemplate ? 'simple' : 'full';
			const zipBlob = await zip.generateAsync({ type: 'blob' });
			downloadZip(zipBlob, `${getBaseFileName()}_svg_export_${templateType}.zip`);
			
			showNotification(`Exported main process and ${subprocesses.length} subprocess(es) as ZIP file with ${templateType} navigation`, 'success');
		} catch (error: any) {
			throw new Error(`Failed to export subprocesses: ${error.message}`);
		}
	}

	async function exportSubprocessSVGContent(subprocess: any, index: number): Promise<string | null> {
		try {
			// Create a temporary modeler instance for the subprocess
			const tempContainer = document.createElement('div');
			tempContainer.style.position = 'absolute';
			tempContainer.style.left = '-9999px';
			tempContainer.style.width = '1000px';
			tempContainer.style.height = '800px';
			document.body.appendChild(tempContainer);

			const tempModeler = new BpmnModeler({
				container: tempContainer,
				width: 1000,
				height: 800
			});

			try {
				// Get the current XML to extract subprocess definition
				const { xml } = await modeler.saveXML({ format: true });
				
				// Create a minimal BPMN diagram containing only the subprocess
				const subprocessXML = await createSubprocessXML(subprocess, xml);
				
				// Import the subprocess into the temporary modeler
				await tempModeler.importXML(subprocessXML);
				
				// Fit the subprocess in the view
				const canvas: any = tempModeler.get('canvas');
				canvas.zoom('fit-viewport', 'auto');
				
				// Export the subprocess as SVG
				const { svg } = await tempModeler.saveSVG();
				
				return svg;
				
			} finally {
				// Clean up temporary modeler and container
				tempModeler.destroy();
				document.body.removeChild(tempContainer);
			}
		} catch (error: any) {
			console.error(`Failed to export subprocess ${index}:`, error);
			return null;
		}
	}

	async function createSubprocessXML(subprocess: any, originalXML: string): Promise<string> {
		// This is a simplified approach - in a real implementation, you might want to
		// extract the actual subprocess definition from the XML
		// For now, we'll create a basic diagram with the subprocess expanded
		
		const subprocessId = subprocess.id;
		const subprocessName = subprocess.businessObject?.name || 'Subprocess';
		
		// Create a basic BPMN XML template with the subprocess content
		return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  targetNamespace="http://bpmn.io/schema/bpmn" 
  id="Definitions_subprocess_${subprocessId}">
  <bpmn:process id="Process_subprocess_${subprocessId}" isExecutable="false">
    <bpmn:startEvent id="StartEvent_subprocess" name="Start ${subprocessName}">
      <bpmn:outgoing>Flow_subprocess_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_subprocess" name="${subprocessName}">
      <bpmn:incoming>Flow_subprocess_1</bpmn:incoming>
      <bpmn:outgoing>Flow_subprocess_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_subprocess" name="End ${subprocessName}">
      <bpmn:incoming>Flow_subprocess_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_subprocess_1" sourceRef="StartEvent_subprocess" targetRef="Task_subprocess" />
    <bpmn:sequenceFlow id="Flow_subprocess_2" sourceRef="Task_subprocess" targetRef="EndEvent_subprocess" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_subprocess_${subprocessId}">
    <bpmndi:BPMNPlane id="BPMNPlane_subprocess_${subprocessId}" bpmnElement="Process_subprocess_${subprocessId}">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_subprocess" bpmnElement="StartEvent_subprocess">
        <dc:Bounds x="179" y="79" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_Task_subprocess" bpmnElement="Task_subprocess">
        <dc:Bounds x="270" y="57" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_EndEvent_subprocess" bpmnElement="EndEvent_subprocess">
        <dc:Bounds x="422" y="79" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="_BPMNEdge_Flow_subprocess_1" bpmnElement="Flow_subprocess_1">
        <di:waypoint x="215" y="97" />
        <di:waypoint x="270" y="97" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="_BPMNEdge_Flow_subprocess_2" bpmnElement="Flow_subprocess_2">
        <di:waypoint x="370" y="97" />
        <di:waypoint x="422" y="97" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
	}

	function sanitizeFilename(name: string): string {
		// Remove or replace characters that are not allowed in filenames
		return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').toLowerCase();
	}

    function createNavigationHTML(svgData: { filename: string; title: string; content: string }[], projectName: string): string {
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();
        
        // Generate navigation items
        const navItems = svgData.map((item, index) => {
            const escapedTitle = item.title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            return `<li class="nav-item">
                <a class="nav-link${index === 0 ? ' active' : ''}" onclick="loadSVG(${index}, this)">
                    ${index === 0 ? '🏠' : '📦'} ${escapedTitle}
                </a>
            </li>`;
        }).join('');
        
        // Don't manually escape - let JSON.stringify handle it properly
        const svgDataForJSON = svgData.map(item => ({
            filename: item.filename,
            title: item.title,
            content: item.content
        }));
        
        // Use the template and replace placeholders
        const htmlTemplate = navigationTemplate
            .replace(/{{PROJECT_NAME}}/g, projectName)
            .replace(/{{EXPORT_DATE}}/g, currentDate)
            .replace(/{{EXPORT_TIME}}/g, currentTime)
            .replace(/{{TOTAL_PROCESSES}}/g, svgData.length.toString())
            .replace(/{{NAV_ITEMS}}/g, navItems)
            .replace(/{{SVG_DATA_JSON}}/g, JSON.stringify(svgDataForJSON));
        
        return htmlTemplate;
    }

    function createSimpleNavigationHTML(svgData: { filename: string; title: string; content: string }[], projectName: string): string {
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();
        
        // Don't manually escape - let JSON.stringify handle it properly
        const svgDataForJSON = svgData.map(item => ({
            filename: item.filename,
            title: item.title,
            content: item.content
        }));
        
        // Use the simple template and replace placeholders
        const htmlTemplate = simpleNavigationTemplate
            .replace(/{{PROJECT_NAME}}/g, projectName)
            .replace(/{{EXPORT_DATE}}/g, currentDate)
            .replace(/{{EXPORT_TIME}}/g, currentTime)
            .replace(/{{TOTAL_PROCESSES}}/g, svgData.length.toString())
            .replace(/{{SVG_DATA_JSON}}/g, JSON.stringify(svgDataForJSON));
        
        return htmlTemplate;
    }

	function downloadSVG(svgContent: string, filename: string) {
		const blob = new Blob([svgContent], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function downloadZip(zipBlob: Blob, filename: string) {
		const url = URL.createObjectURL(zipBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function getBaseFileName(): string {
		if (fileInfo.name && fileInfo.name !== 'untitled.bpmn') {
			return fileInfo.name.replace(/\.(bpmn|xml)$/i, '');
		}
		return 'diagram';
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
	<div class="bg-surface-100 border-b border-surface-300-600-token h-16 flex flex-shrink-0 px-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2 h-full ">
				<button
					class="h-full  btn btn-sm variant-filled-primary hover:bg-primary-100"
					on:click={newFile}
					title="New File"
				>
					<FileText size={16} />
					<span class="hidden sm:inline">New</span>
				</button>
				
				<button
					class="h-full btn btn-sm variant-filled-secondary hover:bg-surface-200"
					on:click={openFile}
					title="Open File"
				>
					<FolderOpen size={16} />
					<span class="hidden sm:inline">Open</span>
				</button>
				
				<button
					class="h-full btn btn-sm variant-filled-tertiary hover:bg-surface-200"
					on:click={() => saveFile(false)}
					disabled={saveStatus === 'saving'}
					title="Save"
				>
					<svelte:component this={getSaveStatusIcon()} size={16} class={getSaveStatusColor()} />
					<span class="hidden sm:inline">Save</span>
				</button>
				
				<button
					class="h-full btn btn-sm variant-filled-surface hover:bg-surface-200"
					on:click={() => saveFile(true)}
					disabled={saveStatus === 'saving'}
					title="Save As"
				>
					<Download size={16} />
					<span class="hidden sm:inline">Save As</span>
				</button>

				<div class="h-full flex items-center">
					<div class="h-6 w-px bg-surface-300 mx-2"></div>
				</div>

				<button
					class="h-full btn btn-sm variant-filled-warning hover:bg-warning-200"
					on:click={() => exportSVG(false)}
					disabled={!isInitialized}
					title="Export current view as SVG"
				>
					<Image size={16} />
					<span class="hidden sm:inline">Export SVG</span>
				</button>

				<!-- <button
					class="h-full btn btn-sm variant-filled-success hover:bg-success-200"
					on:click={() => exportSVG(true, false)}
					disabled={!isInitialized}
					title="Export main process and each subprocess as SVG files in a ZIP archive with full navigation"
				>
					<Images size={16} />
					<span class="hidden sm:inline">Export ZIP</span>
				</button> -->

				<button
					class="h-full btn btn-sm variant-filled-tertiary hover:bg-tertiary-200"
					on:click={() => exportSVG(true, true)}
					disabled={!isInitialized}
					title="Export svg as zip with a simple html navigation page"
				>
					<Images size={16} />
					<span class="hidden sm:inline">Export Zip</span>
				</button>

				<button
					class="h-full btn btn-sm variant-ghost-surface hover:bg-surface-200"
					on:click={showHelp}
					title="How to access all BPMN elements"
				>
					<CircleQuestionMark size={16} />
					<span class="hidden sm:inline">Help</span>
				</button>
			</div>

			<!-- File info and save status -->
			<div class="flex items-center gap-4 text-sm float-right">
				{#if fileInfo.name}
					<div class="flex items-center gap-2">
						<span class="">File:</span>
						<span class="font-medium">{fileInfo.name}</span>
					</div>
				{/if}
				
				{#if lastSaveTime}
					<div class="flex items-center gap-2">
						<span class="">Last saved:</span>
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
