const fs = require('fs');
let code = fs.readFileSync('src/context.tsx', 'utf8');

code = code.replace(`  const startGlobalHuddle = (targetId: string, targetType: 'person' | 'channel') => {
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 360) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 200) : 100;

    setActiveHuddle({
      inCall: true,`,
`  const startGlobalHuddle = (targetId: string, targetType: 'person' | 'channel') => {
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 360) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 200) : 100;
    const part = () => Math.random().toString(36).substring(2, 5);
    const generatedCode = \`\${part()}-\${part()}-\${part()}\`;

    setActiveHuddle({
      inCall: true,
      code: generatedCode,
      startedAt: Date.now(),`);

fs.writeFileSync('src/context.tsx', code);
