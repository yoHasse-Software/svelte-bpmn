<script lang="ts">
	import { 
		Info, 
		MousePointer, 
		Wrench, 
		MoreHorizontal,
		X
	} from 'lucide-svelte';
	
	let showHelp = false;
	
	function toggleHelp() {
		showHelp = !showHelp;
	}
</script>

<!-- Help Toggle Button -->
<button
	class="btn btn-sm variant-filled-surface absolute top-4 right-4 z-50"
	on:click={toggleHelp}
	title="Show BPMN Element Guide"
>
	<Info size={16} />
	<span class="hidden sm:inline">Help</span>
</button>

<!-- Help Modal/Overlay -->
{#if showHelp}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-surface-100-800-token rounded-container-token max-w-2xl w-full max-h-[80vh] overflow-y-auto">
			<div class="p-6">
				<!-- Header -->
				<div class="flex items-center justify-between mb-6">
					<h2 class="h3">How to Access All BPMN Elements</h2>
					<button
						class="btn btn-sm variant-ghost-surface"
						on:click={toggleHelp}
					>
						<X size={16} />
					</button>
				</div>

				<!-- Content -->
				<div class="space-y-6">
					<!-- Method 1: Replace Menu -->
					<div class="card p-4">
						<div class="flex items-start gap-3">
							<div class="text-primary-500">
								<Wrench size={24} />
							</div>
							<div>
								<h3 class="h4 mb-2">1. Using the Replace Menu (Wrench Icon)</h3>
								<p class="text-sm mb-3">
									The most common way to access all BPMN element types:
								</p>
								<ol class="list-decimal list-inside text-sm space-y-1 ml-4">
									<li>Click on any element in your diagram</li>
									<li>Look for the <strong>wrench icon (🔧)</strong> that appears</li>
									<li>Click it to see all possible element types</li>
									<li>Select the element type you want (e.g., Message Start Event)</li>
								</ol>
							</div>
						</div>
					</div>

					<!-- Method 2: Context Menu -->
					<div class="card p-4">
						<div class="flex items-start gap-3">
							<div class="text-secondary-500">
								<MousePointer size={24} />
							</div>
							<div>
								<h3 class="h4 mb-2">2. Right-Click Context Menu</h3>
								<p class="text-sm mb-3">
									Alternative access method:
								</p>
								<ol class="list-decimal list-inside text-sm space-y-1 ml-4">
									<li>Right-click on any element</li>
									<li>Select "Replace" from the context menu</li>
									<li>Choose from available element types</li>
								</ol>
							</div>
						</div>
					</div>

					<!-- Method 3: Morphing -->
					<div class="card p-4">
						<div class="flex items-start gap-3">
							<div class="text-tertiary-500">
								<MoreHorizontal size={24} />
							</div>
							<div>
								<h3 class="h4 mb-2">3. Element Morphing</h3>
								<p class="text-sm mb-3">
									Start with basic elements and transform them:
								</p>
								<ul class="list-disc list-inside text-sm space-y-1 ml-4">
									<li><strong>Start Events:</strong> Create a start event, then use wrench to change to Message/Timer/Conditional/Signal/Error events</li>
									<li><strong>Tasks:</strong> Create a task, then morph to Service/User/Manual/Business Rule/Script tasks</li>
									<li><strong>Gateways:</strong> Create a gateway, then change to Parallel/Inclusive/Event-based gateways</li>
									<li><strong>End Events:</strong> Morph to Message/Error/Escalation/Signal/Terminate end events</li>
								</ul>
							</div>
						</div>
					</div>

					<!-- Available Elements -->
					<div class="card p-4">
						<h3 class="h4 mb-3">Available BPMN Elements</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<h4 class="font-semibold mb-2">🟢 Start Events</h4>
								<ul class="space-y-1">
									<li>• None Start Event</li>
									<li>• Message Start Event</li>
									<li>• Timer Start Event</li>
									<li>• Conditional Start Event</li>
									<li>• Signal Start Event</li>
									<li>• Error Start Event</li>
									<li>• Escalation Start Event</li>
									<li>• Compensation Start Event</li>
								</ul>
							</div>
							
							<div>
								<h4 class="font-semibold mb-2">🔴 End Events</h4>
								<ul class="space-y-1">
									<li>• None End Event</li>
									<li>• Message End Event</li>
									<li>• Error End Event</li>
									<li>• Escalation End Event</li>
									<li>• Signal End Event</li>
									<li>• Terminate End Event</li>
									<li>• Compensation End Event</li>
								</ul>
							</div>
							
							<div>
								<h4 class="font-semibold mb-2">📋 Tasks</h4>
								<ul class="space-y-1">
									<li>• Task (Generic)</li>
									<li>• Service Task</li>
									<li>• User Task</li>
									<li>• Manual Task</li>
									<li>• Business Rule Task</li>
									<li>• Script Task</li>
									<li>• Send Task</li>
									<li>• Receive Task</li>
								</ul>
							</div>
							
							<div>
								<h4 class="font-semibold mb-2">💎 Gateways</h4>
								<ul class="space-y-1">
									<li>• Exclusive Gateway</li>
									<li>• Parallel Gateway</li>
									<li>• Inclusive Gateway</li>
									<li>• Event-based Gateway</li>
									<li>• Complex Gateway</li>
								</ul>
							</div>
						</div>
					</div>

					<!-- Pro Tip -->
					<div class="variant-ghost-primary p-4 rounded-container-token">
						<h4 class="font-semibold mb-2">💡 Pro Tip</h4>
						<p class="text-sm">
							The bpmn-js library includes <strong>all BPMN 2.0 elements</strong> by default. 
							The limited palette is intentional for usability - use the wrench icon to access the full range of elements!
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
