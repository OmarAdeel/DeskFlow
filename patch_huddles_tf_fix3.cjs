const fs = require('fs');
let code = fs.readFileSync('src/components/views/Huddles.tsx', 'utf8');

code = code.replace(
  "             ctx?.putImageData(mask, 0, 0);",
  "             if (mask && mask.width > 0 && mask.height > 0) {\n               ctx?.putImageData(mask, 0, 0);\n             }"
);

fs.writeFileSync('src/components/views/Huddles.tsx', code);
