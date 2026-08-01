import { Activity, Search, Compass, MessageSquare, CheckCircle2 } from 'lucide-react';
import { ViewType } from '../../types';

interface PlaceholderProps {
  viewId: string;
}

export function PlaceholderView({ viewId }: PlaceholderProps) {
  const getDetails = () => {
    switch(viewId) {
      case 'threads': return { title: 'Threads', desc: 'Catch up on conversations you are participating in.' };
      case 'huddles': return { title: 'Huddles', desc: 'Audio and video calls with your team.' };
      case 'drafts': return { title: 'Drafts', desc: 'Messages you have started writing but haven\'t sent.' };
      case 'directories': return { title: 'Directories', desc: 'Find people, channels, and apps.' };
      case 'channel': return { title: 'Channel View', desc: 'This specific channel is coming soon.' };
      default: return { title: 'Coming Soon', desc: 'This module is currently being built.' };
    }
  };

  const { title, desc } = getDetails();

  return (
    <div className="flex-1 bg-[#222529] flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-[#1A1D21] rounded-full flex items-center justify-center mb-6 border border-gray-800 shadow-lg">
        <Compass className="h-10 w-10 text-gray-500" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-3 capitalize">{title}</h2>
      <p className="text-gray-400 max-w-md text-lg mb-8">
        {desc}
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-lg w-full text-left">
        <div className="bg-[#1A1D21] p-4 rounded-lg border border-gray-800">
          <div className="flex items-center text-gray-300 font-medium mb-2">
            <CheckCircle2 className="h-4 w-4 mr-2 text-[#4CAF50]" /> Component Ready
          </div>
          <p className="text-sm text-gray-500">The navigation wiring for {title} is complete and fully functional.</p>
        </div>
        <div className="bg-[#1A1D21] p-4 rounded-lg border border-gray-800">
          <div className="flex items-center text-gray-300 font-medium mb-2">
            <Activity className="h-4 w-4 mr-2 text-blue-500" /> Next Steps
          </div>
          <p className="text-sm text-gray-500">Awaiting custom feature requirements to finalize this specific layout.</p>
        </div>
      </div>
    </div>
  );
}
