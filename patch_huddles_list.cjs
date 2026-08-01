const fs = require('fs');
let code = fs.readFileSync('src/components/views/Huddles.tsx', 'utf8');

code = code.replace(`                {/* List block */}
                <div className="bg-[#121317] border border-gray-800/80 rounded-2xl divide-y divide-[#1A1D21] overflow-hidden shadow-xl">`,
`                {huddleLogs.length > 0 && (
                  <div className="mb-8 bg-[#121317] border border-gray-800/80 rounded-2xl divide-y divide-[#1A1D21] overflow-hidden shadow-xl">
                    <div className="px-4 py-3 bg-[#1A1D21] border-b border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold text-gray-200 text-sm">{isArabic ? 'سجل الاجتماعات' : 'Huddle History Logs'}</h3>
                    </div>
                    {huddleLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-[#121317] hover:bg-[#1A1D21]/50 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-[#1A1D21] rounded-xl flex items-center justify-center border border-gray-800 text-purple-400">
                            <Headphones className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-200 text-sm">
                              {log.targetName} <span className="ml-2 text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-mono">Code: {log.code}</span>
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                              <span>{new Date(log.startedAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                              <span>{log.duration} sec</span>
                              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                              <span>{log.participants.join(', ')}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List block */}
                <div className="bg-[#121317] border border-gray-800/80 rounded-2xl divide-y divide-[#1A1D21] overflow-hidden shadow-xl">`);

fs.writeFileSync('src/components/views/Huddles.tsx', code);
