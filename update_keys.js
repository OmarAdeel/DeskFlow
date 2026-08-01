const fs = require('fs');
let code = fs.readFileSync('src/context.tsx', 'utf8');

code = code.replace(/'workspaceName'/g, "'workspace_name'");
code = code.replace(/'channels'/g, "'workspace_channels'");
code = code.replace(/'users'/g, "'workspace_users'");
code = code.replace(/'messages'/g, "'workspace_messages'");
code = code.replace(/'drafts'/g, "'workspace_drafts'");
code = code.replace(/'savedItems'/g, "'workspace_savedItems'");
code = code.replace(/'user_language'/g, "'workspace_user_language'");
code = code.replace(/'user_theme'/g, "'workspace_user_theme'");
code = code.replace(/'user_status'/g, "'workspace_user_status'");

fs.writeFileSync('src/context.tsx', code);
