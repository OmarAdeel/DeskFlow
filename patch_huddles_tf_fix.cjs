const fs = require('fs');
let code = fs.readFileSync('src/components/views/Huddles.tsx', 'utf8');

code = code.replace(
  "const mask = await bodySegmentation.toBinaryMask(segmentation, foregroundColor, backgroundColor);",
  "if (!segmentation || segmentation.length === 0) {\n               ctx?.clearRect(0, 0, canvas.width, canvas.height);\n               requestRef.current = requestAnimationFrame(renderFrame);\n               return;\n             }\n             const mask = await bodySegmentation.toBinaryMask(segmentation, foregroundColor, backgroundColor);"
);

fs.writeFileSync('src/components/views/Huddles.tsx', code);
