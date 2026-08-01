const fs = require('fs');
let code = fs.readFileSync('src/components/views/Huddles.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { getTranslation } from '../../utils/i18n';",
  "import { getTranslation } from '../../utils/i18n';\nimport '@tensorflow/tfjs-core';\nimport '@tensorflow/tfjs-backend-webgl';\nimport '@tensorflow/tfjs-converter';\nimport * as bodySegmentation from '@tensorflow-models/body-segmentation';"
);

// Add refs and effects
const refsStr = `
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
`;
const newRefsStr = refsStr + `
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmenterRef = useRef<any>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    let active = true;
    const loadModel = async () => {
      try {
        const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
        const segmenterConfig = {
          runtime: 'tfjs',
          modelType: 'general',
        };
        const segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
        if (active) segmenterRef.current = segmenter;
      } catch (err) {
        console.error("Failed to load segmenter", err);
      }
    };
    loadModel();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const renderFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !segmenterRef.current) {
        requestRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.readyState < 2 || video.videoWidth === 0) {
        requestRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      if ((selectedVirtualBackground !== 'none' || selectedBlurEffect !== 'none') && videoEnabled && !screenSharing) {
        try {
          const segmentation = await segmenterRef.current.segmentPeople(video);
          
          if (selectedBlurEffect !== 'none') {
             const blurAmount = selectedBlurEffect === 'subtle' ? 8 : 16;
             await bodySegmentation.drawBokehEffect(canvas, video, segmentation, 0.5, blurAmount);
          } else {
             const foregroundColor = {r: 255, g: 255, b: 255, a: 255};
             const backgroundColor = {r: 0, g: 0, b: 0, a: 0};
             const mask = await bodySegmentation.toBinaryMask(segmentation, foregroundColor, backgroundColor);
             
             ctx?.clearRect(0, 0, canvas.width, canvas.height);
             ctx?.putImageData(mask, 0, 0);
             if (ctx) {
               ctx.globalCompositeOperation = 'source-in';
               ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
               ctx.globalCompositeOperation = 'source-over';
             }
          }
        } catch (e) {
          console.error("Segmentation error", e);
        }
      } else {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      requestRef.current = requestAnimationFrame(renderFrame);
    };
    
    requestRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [selectedVirtualBackground, selectedBlurEffect, videoEnabled, screenSharing]);
`;
code = code.replace(refsStr, newRefsStr);

// Add canvas below video
const videoStr = `
          {/* Main Stage Video Feed (Camera or Screen Share) */}
          {(videoEnabled || screenSharing) ? (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-contain bg-black transition-all duration-300 rounded-2xl sm:rounded-3xl"
              style={{
                transform: (videoEnabled && !screenSharing) ? 'scaleX(-1)' : undefined,
                filter: getColorGradeFilter(activeColorFilter),
              }}
            />
          ) : (`;
const newVideoStr = `
          {/* Main Stage Video Feed (Camera or Screen Share) */}
          {(videoEnabled || screenSharing) ? (
            <>
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className={\`absolute inset-0 w-full h-full object-contain transition-all duration-300 rounded-2xl sm:rounded-3xl \${
                  (selectedVirtualBackground !== 'none' || selectedBlurEffect !== 'none') && !screenSharing 
                    ? 'opacity-0 pointer-events-none' 
                    : 'bg-black'
                }\`}
                style={{
                  transform: (videoEnabled && !screenSharing) ? 'scaleX(-1)' : undefined,
                  filter: getColorGradeFilter(activeColorFilter),
                }}
              />
              <canvas
                ref={canvasRef}
                className={\`absolute inset-0 w-full h-full object-contain transition-all duration-300 rounded-2xl sm:rounded-3xl \${
                  (selectedVirtualBackground !== 'none' || selectedBlurEffect !== 'none') && !screenSharing 
                    ? 'opacity-100' 
                    : 'opacity-0 pointer-events-none'
                }\`}
                style={{
                  transform: (videoEnabled && !screenSharing) ? 'scaleX(-1)' : undefined,
                  filter: getColorGradeFilter(activeColorFilter),
                }}
              />
            </>
          ) : (`;
code = code.replace(videoStr, newVideoStr);

fs.writeFileSync('src/components/views/Huddles.tsx', code);
