const fs = require('fs');
let code = fs.readFileSync('src/context.tsx', 'utf8');

code = code.replace(`  const endGlobalHuddle = () => {
    if (activeHuddle.isRecording) {`,
`  const endGlobalHuddle = () => {
    if (activeHuddle.inCall) {
      let channelLabel = 'Unknown';
      if (activeHuddle.targetType === 'person') {
        const u = users.find(x => x.id === activeHuddle.targetId);
        if (u) channelLabel = \`@\${u.name}\`;
      } else if (activeHuddle.targetType === 'channel') {
        const c = channels.find(x => x.id === activeHuddle.targetId);
        if (c) channelLabel = \`#\${c.name}\`;
      }
      
      const newLog: HuddleLogEntry = {
        id: \`log-\${Date.now()}\`,
        code: activeHuddle.code,
        startedAt: activeHuddle.startedAt,
        duration: Math.floor((Date.now() - activeHuddle.startedAt) / 1000),
        targetName: channelLabel,
        participants: [users.find(u => u.name === 'Abdallah Sayed')?.name || 'Abdallah Sayed', channelLabel.startsWith('@') ? channelLabel.substring(1) : 'Team Members'],
      };
      setHuddleLogs(prev => [newLog, ...prev]);
    }

    if (activeHuddle.isRecording) {`);

fs.writeFileSync('src/context.tsx', code);
