import { Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';

const mockMeetings = [
  { id: 1, title: 'Weekly Sync', time: '10:00 AM - 11:00 AM', attendees: 4, type: 'video' },
  { id: 2, title: 'Client Onboarding', time: '1:30 PM - 2:00 PM', attendees: 2, type: 'call' },
  { id: 3, title: 'Project Alpha Review', time: '4:00 PM - 5:00 PM', attendees: 6, type: 'video' },
];

export function MeetingsView() {
  return (
    <div className="flex-1 bg-[#222529] flex flex-col h-full text-gray-200">
      <div className="px-6 py-6 border-b border-gray-800 bg-gradient-to-b from-[#1A1D21] to-transparent flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Meetings</h2>
          <p className="text-sm text-gray-400">Schedule and manage your daily huddles.</p>
        </div>
        <button className="bg-[#4CAF50] hover:bg-[#45a049] text-[#1A1D21] font-medium px-4 py-2 rounded-md transition-colors shadow-lg flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" /> New Meeting
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col md:flex-row gap-6">
        
        {/* Calendar Side Pane */}
        <div className="w-full md:w-80 bg-[#1A1D21] border border-gray-800 rounded-xl p-5 shrink-0 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">May 2026</h3>
            <div className="flex space-x-2">
              <button className="text-gray-400 hover:text-white">&lt;</button>
              <button className="text-gray-400 hover:text-white">&gt;</button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
             {/* Fake Calendar Grid */}
             {Array.from({length: 31}).map((_, i) => (
                <div 
                  key={i} 
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-800 transition-colors ${i + 1 === 22 ? 'bg-[#4CAF50] text-[#1A1D21] shadow-lg' : 'text-gray-300'}`}
                >
                  {i + 1}
                </div>
             ))}
          </div>
        </div>

        {/* Schedule List */}
        <div className="flex-1 space-y-4">
          <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wider mb-2">Today - May 22, 2026</h3>
          
          {mockMeetings.map(meeting => (
            <div key={meeting.id} className="bg-[#1A1D21] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between hover:border-gray-600 transition-colors group cursor-pointer">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gray-800 rounded-lg text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{meeting.title}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {meeting.time}</span>
                    <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> {meeting.attendees} Attendees</span>
                  </div>
                </div>
              </div>
              <button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors border border-blue-500 shadow-sm">
                Join
              </button>
            </div>
          ))}

          <div className="flex justify-center pt-8">
             <div className="bg-gray-800/50 text-gray-500 px-6 py-2 rounded-full text-sm font-medium">
               No more meetings today
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
