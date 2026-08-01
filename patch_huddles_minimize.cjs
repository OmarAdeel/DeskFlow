const fs = require('fs');
let code = fs.readFileSync('src/components/views/Huddles.tsx', 'utf8');

code = code.replace(`          {/* 4. Screen Share Button */}
          <button 
            onClick={toggleHuddleScreenShare}
            className={\`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 \${
              screenSharing ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }\`}
            title={screenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>`,
`          {/* 4. Screen Share Button */}
          <button 
            onClick={toggleHuddleScreenShare}
            className={\`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 \${
              screenSharing ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }\`}
            title={screenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Minimize Button */}
          <button 
            onClick={() => setHuddleMinimized(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="Minimize Huddle"
          >
            <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>`);

fs.writeFileSync('src/components/views/Huddles.tsx', code);
