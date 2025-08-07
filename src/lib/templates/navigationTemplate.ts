export const navigationTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PROJECT_NAME}} - BPMN Process Navigator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; padding: 20px;
        }
        .container {
            max-width: 1200px; margin: 0 auto; background: white;
            border-radius: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white; padding: 30px; text-align: center;
        }
        .header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 10px; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .export-info {
            background: #f8fafc; padding: 20px 30px; border-bottom: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: center;
            flex-wrap: wrap; gap: 10px;
        }
        .export-info strong { color: #1e293b; }
        .main-content { display: flex; min-height: 600px; }
        .sidebar {
            width: 300px; background: #f1f5f9; border-right: 1px solid #e2e8f0; padding: 0;
        }
        .nav-title {
            padding: 20px; background: #e2e8f0; font-weight: 600; color: #334155;
            border-bottom: 1px solid #cbd5e1;
        }
        .nav-list { list-style: none; }
        .nav-item { border-bottom: 1px solid #e2e8f0; }
        .nav-link {
            display: block; padding: 15px 20px; text-decoration: none; color: #475569;
            transition: all 0.3s ease; cursor: pointer; position: relative;
        }
        .nav-link:hover, .nav-link.active {
            background: #4f46e5; color: white; transform: translateX(5px);
        }
        .nav-link.active::before {
            content: ''; position: absolute; left: 0; top: 0; bottom: 0;
            width: 4px; background: #7c3aed;
        }
        .viewer {
            flex: 1; padding: 30px; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: white;
        }
        .svg-container {
            width: 100%; max-width: 100%; text-align: center; border: 2px solid #e2e8f0;
            border-radius: 8px; padding: 20px; background: #fafafa;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .svg-container svg { max-width: 100%; height: auto; border-radius: 4px; overflow:hidden; }
        .svg-title {
            font-size: 1.5rem; font-weight: 600; color: #1e293b; margin-bottom: 15px;
            padding: 10px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;
        }
        .no-selection { color: #64748b; font-size: 1.1rem; text-align: center; }
        .controls {
            margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;
            justify-content: center;
        }
        .btn {
            padding: 10px 20px; border: none; border-radius: 6px; background: #4f46e5;
            color: white; cursor: pointer; font-size: 14px; font-weight: 500;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #4338ca; transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }
        .btn-secondary { background: #64748b; }
        .btn-secondary:hover { background: #475569; }
        @media (max-width: 768px) {
            .main-content { flex-direction: column; }
            .sidebar { width: 100%; }
            .header h1 { font-size: 2rem; }
            .export-info { flex-direction: column; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 BPMN Process Navigator</h1>
            <p>Interactive viewer for {{PROJECT_NAME}} processes and subprocesses</p>
        </div>
        <div class="export-info">
            <div><strong>Project:</strong> {{PROJECT_NAME}}</div>
            <div><strong>Exported:</strong> {{EXPORT_DATE}} at {{EXPORT_TIME}}</div>
            <div><strong>Total Processes:</strong> {{TOTAL_PROCESSES}}</div>
        </div>
        <div class="main-content">
            <div class="sidebar">
                <div class="nav-title">📋 Process Navigation</div>
                <ul class="nav-list">{{NAV_ITEMS}}</ul>
            </div>
            <div class="viewer">
                <div id="svg-viewer">
                    <div class="no-selection">👈 Select a process from the navigation menu to view the diagram</div>
                </div>
                <div class="controls">
                    <button class="btn" onclick="downloadCurrent()">💾 Download Current SVG</button>
                    <button class="btn btn-secondary" onclick="resetZoom()">🔍 Reset Zoom</button>
                    <button class="btn btn-secondary" onclick="toggleFullscreen()">⛶ Toggle Fullscreen</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        let currentSVG = null, currentFilename = null;
        
        // Embedded SVG content to avoid CORS issues with local files
        const svgData = {{SVG_DATA_JSON}};
        
        window.onload = () => {
            if (svgData.length > 0) {
                loadSVG(0, document.querySelector('.nav-link'));
            }
        };
        
        function loadSVG(index, element) {
            try {
                if (index < 0 || index >= svgData.length) return;
                
                const svgItem = svgData[index];
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                element.classList.add('active');
                
                const viewer = document.getElementById('svg-viewer');
                viewer.innerHTML = '<div class="svg-title">' + svgItem.title + '</div><div class="svg-container">' + svgItem.content + '</div>';
                currentSVG = svgItem.content;
                currentFilename = svgItem.filename;
                makeInteractive();
            } catch (error) {
                console.error('Error loading SVG:', error);
                document.getElementById('svg-viewer').innerHTML = '<div class="no-selection">❌ Error loading diagram</div>';
            }
        }
        
        function makeInteractive() {
            const svg = document.querySelector('#svg-viewer svg');
            if (svg) {
                let scale = 1, translateX = 0, translateY = 0, isDragging = false, lastMouseX = 0, lastMouseY = 0;
                svg.style.cursor = 'grab';
                
                svg.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    scale *= e.deltaY > 0 ? 0.9 : 1.1;
                    scale = Math.min(Math.max(scale, 0.1), 5);
                    updateTransform();
                });
                
                svg.addEventListener('mousedown', (e) => {
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
            if (e.key === 'Escape') resetZoom();
            else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
            else if (e.key === 'd' || e.key === 'D') downloadCurrent();
        });
    </script>
</body>
</html>`;
