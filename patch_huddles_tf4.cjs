const fs = require('fs');
let code = fs.readFileSync('src/components/views/Huddles.tsx', 'utf8');

const oldDraw = `             ctx?.clearRect(0, 0, canvas.width, canvas.height);
             if (mask && mask.width > 0 && mask.height > 0) {
               ctx?.putImageData(mask, 0, 0);
             }
             if (ctx) {
               ctx.globalCompositeOperation = 'source-in';
               ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
               ctx.globalCompositeOperation = 'source-over';
             }`;

const newDraw = `             ctx?.clearRect(0, 0, canvas.width, canvas.height);
             if (mask && mask.width > 0 && mask.height > 0 && ctx) {
               // Soften mask edges for better isolation
               const offCanvas = document.createElement('canvas');
               offCanvas.width = canvas.width;
               offCanvas.height = canvas.height;
               const offCtx = offCanvas.getContext('2d');
               if (offCtx) {
                 offCtx.putImageData(mask, 0, 0);
                 ctx.filter = 'blur(4px)'; // Blur the mask
                 ctx.drawImage(offCanvas, 0, 0);
                 ctx.filter = 'none';
                 ctx.globalCompositeOperation = 'source-in';
                 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                 ctx.globalCompositeOperation = 'source-over';
               } else {
                 // Fallback if offscreen canvas fails
                 ctx.putImageData(mask, 0, 0);
                 ctx.globalCompositeOperation = 'source-in';
                 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                 ctx.globalCompositeOperation = 'source-over';
               }
             }`;

code = code.replace(oldDraw, newDraw);
fs.writeFileSync('src/components/views/Huddles.tsx', code);
