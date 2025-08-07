export const simpleNavigationTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PROJECT_NAME}} - BPMN Process Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: #4f46e5;
            color: white;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 1.8rem;
            font-weight: 600;
        }
        
        .header-info {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .breadcrumb {
            background: #e2e8f0;
            padding: 15px 30px;
            border-bottom: 1px solid #cbd5e1;
        }
        
        .breadcrumb-nav {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .breadcrumb-item {
            color: #64748b;
            text-decoration: none;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
        }
        
        .breadcrumb-item:hover {
            background: #cbd5e1;
            color: #334155;
        }
        
        .breadcrumb-item.active {
            color: #1e293b;
            font-weight: 500;
        }
        
        .breadcrumb-separator {
            color: #94a3b8;
        }
        
        .viewer {
            text-align: center;
            min-height: 600px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .svg-container {
            width: 100%;
            max-width: 100%;
            border: 2px solid #e2e8f0;
            border-radius: 0px 0 8px 8px;
            padding: 20px;
            background: #fafafa;
            overflow: auto;
        }
        
        .svg-container svg {
            max-width: 100%;
            height: auto;
            cursor: grab;
        }
        
        .svg-container svg:active {
            cursor: grabbing;
        }
        
        /* Highlight subprocess elements on hover */
        .svg-container svg [data-marker="sub-process"],
        .svg-container svg [data-element-id*="SubProcess"] rect:not(:first-child) {
            cursor: pointer !important;
            transition: all 0.2s ease;
        }
        
        .svg-container svg [data-marker="sub-process"]:hover,
        .svg-container svg [data-element-id*="SubProcess"] rect:not(:first-child):hover {
            filter: brightness(1.1) drop-shadow(0 0 8px rgba(79, 70, 229, 0.6));
            transform: scale(1.02);
        }
        
        .current-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .controls {
            position: absolute;
            top: auto;
            left: 0;

            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            flex-direction: column;
            padding-left: 32px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #4f46e5;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            
        }
        
        .btn:hover {
            background: #4338ca;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }
        
        .btn-secondary {
            background: #b7bec7ff;
        }
        
        .btn-secondary:hover {
            background: #7f8691ff;
        }
        
        .instructions {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            color: #0c4a6e;
            font-size: 14px;
        }
        
        .instructions strong {
            color: #0369a1;
        }
        
        .no-selection {
            color: #64748b;
            font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
            
            .breadcrumb-nav {
                flex-wrap: wrap;
            }
            
            .viewer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="breadcrumb">
            <nav class="breadcrumb-nav" id="breadcrumb">
                <a href="#" class="breadcrumb-item active" onclick="loadSVG(0)">🏠 Main Process</a>
            </nav>
        </div>
        
        <div class="viewer">
            <div class="controls">
                <button class="btn" onclick="downloadCurrent()" title="Download Current SVG">💾</button>
                <button class="btn btn-secondary" onclick="resetZoom()" title="Reset Zoom">🔍</button>
                <button class="btn btn-secondary" onclick="toggleFullscreen()" title="Toggle Fullscreen">⛶</button>
            </div>

            <div id="svg-viewer">
                <div class="no-selection">Loading diagram...</div>
            </div>
            

        </div>
    </div>
    
    <script>
        let currentSVG = null;
        let currentFilename = null;
        let currentIndex = 0;
        let navigationStack = []; // Track navigation history
        
        // Embedded SVG content to avoid CORS issues with local files
        const svgData = {{SVG_DATA_JSON}};
        
        window.onload = () => {
            if (svgData.length > 0) {
                loadSVG(0);
            }
        };
        
        function loadSVG(index) {
            try {
                if (index < 0 || index >= svgData.length) return;
                
                const svgItem = svgData[index];
                currentIndex = index;
                currentSVG = svgItem.content;
                currentFilename = svgItem.filename;
                
                const viewer = document.getElementById('svg-viewer');
                viewer.innerHTML = '<div class="svg-container">' + svgItem.content + '</div>';
                
                makeInteractive();
                setupSubprocessNavigation();
                updateBreadcrumb();
                
            } catch (error) {
                console.error('Error loading SVG:', error);
                document.getElementById('svg-viewer').innerHTML = '<div class="no-selection">❌ Error loading diagram</div>';
            }
        }
        
        function setupSubprocessNavigation() {
            // Find all subprocess elements in the current SVG
            const subprocessMarkers = document.querySelectorAll('[data-marker="sub-process"]');
            // Query sibling of subprocessMarkers
            const subprocessRects = [];
            subprocessMarkers.forEach(marker => {
                const rects = marker.parentElement.querySelectorAll('rect:not(:first-child)');
                subprocessRects.push(...rects);
            });
            
            // Combine both sets of elements
            const allSubprocessElements = [...subprocessMarkers, ...subprocessRects];
            
            allSubprocessElements.forEach(element => {
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Try to find the subprocess ID from the element or its parent
                    let subprocessId = element.getAttribute('data-element-id') || '';
                    
                    // If clicking on a rect, get the ID from the parent group
                    if (!subprocessId && element.tagName === 'rect') {
                        const parentGroup = element.closest('[data-element-id]');
                        if (parentGroup) {
                            subprocessId = parentGroup.getAttribute('data-element-id') || '';
                        }
                    }
                    
                    const matchingSubprocess = findMatchingSubprocess(subprocessId);
                    
                    if (matchingSubprocess) {
                        // Add current process to navigation stack
                        navigationStack.push({
                            index: currentIndex,
                            title: svgData[currentIndex].title
                        });
                        
                        loadSVG(matchingSubprocess.index);
                    } else {
                        // If no matching subprocess found, show a message
                        alert('Subprocess content not found in exported data.');
                    }
                });
                
                // Add visual feedback
                element.style.cursor = 'pointer';
                element.title = 'Click to view subprocess details';
            });
        }
        
        function findMatchingSubprocess(subprocessId) {
            // Try to find a subprocess that matches this ID or name
            for (let i = 1; i < svgData.length; i++) { // Skip main process (index 0)
                const subprocess = svgData[i];
                // Match by filename containing the subprocess ID or similar name
                if (subprocess.filename.toLowerCase().includes(subprocessId.toLowerCase()) ||
                    subprocess.title.toLowerCase().includes('subprocess')) {
                    return { index: i, data: subprocess };
                }
            }
            
            // If no specific match, return the next subprocess in the list
            if (svgData.length > 1) {
                return { index: 1, data: svgData[1] };
            }
            
            return null;
        }
        
        function updateBreadcrumb() {
            const breadcrumb = document.getElementById('breadcrumb');
            let breadcrumbHTML = '<a href="#" class="breadcrumb-item" onclick="navigateToProcess(0)">🏠 Main Process</a>';
            
            // Add navigation stack items
            navigationStack.forEach((item, index) => {
                if (index > 0) { // Don't repeat main process
                    breadcrumbHTML += '<span class="breadcrumb-separator">›</span>';
                    breadcrumbHTML += '<a href="#" class="breadcrumb-item" onclick="navigateToProcess(' + item.index + ')">' + item.title + '</a>';
                }
            });
            
            // Add current item
            if (currentIndex > 0) {
                breadcrumbHTML += '<span class="breadcrumb-separator">›</span>';
                breadcrumbHTML += '<span class="breadcrumb-item active">' + svgData[currentIndex].title + '</span>';
            } else {
                // Update main process to active
                breadcrumbHTML = '<span class="breadcrumb-item active">🏠 Main Process</span>';
            }
            
            breadcrumb.innerHTML = breadcrumbHTML;
        }
        
        function navigateToProcess(index) {
            // Clear navigation stack up to the target
            const targetStackIndex = navigationStack.findIndex(item => item.index === index);
            if (targetStackIndex >= 0) {
                navigationStack = navigationStack.slice(0, targetStackIndex);
            } else if (index === 0) {
                navigationStack = [];
            }
            
            loadSVG(index);
        }
        
        function makeInteractive() {
            const svg = document.querySelector('#svg-viewer svg');
            if (svg) {
                let scale = 1, translateX = 0, translateY = 0, isDragging = false, lastMouseX = 0, lastMouseY = 0;
                
                svg.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    scale *= e.deltaY > 0 ? 0.9 : 1.1;
                    scale = Math.min(Math.max(scale, 0.1), 5);
                    updateTransform();
                });
                
                svg.addEventListener('mousedown', (e) => {
                    // Don't start dragging if clicking on a subprocess marker or rectangle
                    if (e.target.closest('[data-marker="sub-process"]') || 
                        (e.target.tagName === 'rect' && e.target.closest('[data-element-id*="SubProcess"]') && 
                         !e.target.matches(':first-child'))) {
                        return;
                    }
                    
                    isDragging = true;
                    svg.style.cursor = 'grabbing';
                    lastMouseX = e.clientX;
                    lastMouseY = e.clientY;
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        translateX += e.clientX - lastMouseX;
                        translateY += e.clientY - lastMouseY;
                        lastMouseX = e.clientX;
                        lastMouseY = e.clientY;
                        updateTransform();
                    }
                });
                
                document.addEventListener('mouseup', () => {
                    isDragging = false;
                    svg.style.cursor = 'grab';
                });
                
                function updateTransform() {
                    svg.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
                }
                
                window.resetZoom = () => {
                    scale = 1;
                    translateX = 0;
                    translateY = 0;
                    updateTransform();
                };
            }
        }
        
        function downloadCurrent() {
            if (currentSVG && currentFilename) {
                const blob = new Blob([currentSVG], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = currentFilename;
                a.click();
                URL.revokeObjectURL(url);
            }
        }
        
        function toggleFullscreen() {
            const viewer = document.querySelector('.viewer');
            if (!document.fullscreenElement) {
                viewer.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    resetZoom();
                }
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'd' || e.key === 'D') {
                downloadCurrent();
            } else if (e.key === 'Backspace' && navigationStack.length > 0) {
                // Navigate back with backspace
                const previousProcess = navigationStack.pop();
                loadSVG(previousProcess.index);
            }
        });
    </script>
</body>
</html>`;
