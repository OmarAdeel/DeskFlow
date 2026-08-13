import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useWorkspace } from '../../context';
import type { CalendarEvent, CalendarEventInput } from '../../types';
import { createCalendarEvent, deleteCalendarEvent, listCalendarEvents, updateCalendarEvent } from '../../lib/calendar';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const readableDate = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const readableTime = (value: string) => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const localInputValue = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function calendarRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

const emptyForm = (date: Date): CalendarEventInput => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    ownerId: '', organizationId: null, title: '', description: '',
    startAt: start.toISOString(), endAt: end.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', location: '', meetingUrl: ''
  };
};

export function MeetingsView() {
  const { currentUser, activeOrganizationId } = useWorkspace();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CalendarEventInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
    const count = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: count }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1))];
  }, [visibleMonth]);

  const loadEvents = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    const range = calendarRange(visibleMonth);
    const result = await listCalendarEvents(currentUser.id, activeOrganizationId, range.start, range.end);
    setEvents(result.data);
    setError(result.error);
    setIsLoading(false);
  };

  useEffect(() => { void loadEvents(); }, [currentUser?.id, activeOrganizationId, visibleMonth.getFullYear(), visibleMonth.getMonth()]);

  const eventsByDate = useMemo(() => events.reduce<Record<string, CalendarEvent[]>>((groups, event) => {
    const key = dateKey(new Date(event.startAt));
    groups[key] = [...(groups[key] || []), event];
    return groups;
  }, {}), [events]);

  const selectedEvents = eventsByDate[dateKey(selectedDate)] || [];
  const changeMonth = (offset: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
  };
  const openCreate = (date = selectedDate) => {
    const next = emptyForm(date);
    next.ownerId = currentUser?.id || '';
    next.organizationId = activeOrganizationId;
    setEditingId(null);
    setForm(next);
  };
  const openEdit = (event: CalendarEvent) => {
    setEditingId(event.id);
    setForm({ ownerId: event.ownerId, organizationId: event.organizationId, title: event.title, description: event.description || '', startAt: event.startAt, endAt: event.endAt, timezone: event.timezone, location: event.location || '', meetingUrl: event.meetingUrl || '' });
  };
  const closeForm = () => { if (!isSaving) setForm(null); };
  const updateForm = (field: keyof CalendarEventInput, value: string) => setForm(previous => previous ? { ...previous, [field]: field === 'startAt' || field === 'endAt' ? new Date(value).toISOString() : value } : previous);

  const saveEvent = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || !currentUser) return;
    if (!form.title.trim()) { setError('A title is required.'); return; }
    if (new Date(form.endAt) <= new Date(form.startAt)) { setError('The end time must be after the start time.'); return; }
    setIsSaving(true);
    setError(null);
    const result = editingId ? await updateCalendarEvent(editingId, form) : await createCalendarEvent(form);
    setIsSaving(false);
    if (result.error || !result.data) { setError(result.error || 'Unable to save this event.'); return; }
    setForm(null);
    await loadEvents();
  };

  const removeEvent = async (event: CalendarEvent) => {
    if (!window.confirm(`Delete “${event.title}”?`)) return;
    const deleteError = await deleteCalendarEvent(event.id, currentUser?.id || '');
    if (deleteError) { setError(deleteError); return; }
    setEvents(previous => previous.filter(item => item.id !== event.id));
  };

  return (
    <div className="flex-1 bg-[#222529] flex flex-col h-full text-gray-200 overflow-y-auto">
      <div className="px-6 py-6 border-b border-gray-800 bg-gradient-to-b from-[#1A1D21] to-transparent flex justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold text-white mb-1">Calendar</h2><p className="text-sm text-gray-400">Your personal schedule for this workspace.</p></div>
        <button type="button" onClick={() => openCreate()} className="bg-[#4CAF50] hover:bg-[#45a049] text-[#1A1D21] font-medium px-4 py-2 rounded-md flex items-center"><Plus className="h-4 w-4 mr-2" /> New event</button>
      </div>
      <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6">
        <section className="xl:w-[min(56%,680px)] bg-[#1A1D21] border border-gray-800 rounded-xl p-5 shrink-0">
          <div className="flex justify-between items-center mb-6"><button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="p-2 rounded hover:bg-gray-800"><ChevronLeft className="h-5 w-5" /></button><h3 className="font-bold text-white">{monthLabel(visibleMonth)}</h3><button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="p-2 rounded hover:bg-gray-800"><ChevronRight className="h-5 w-5" /></button></div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">{dayNames.map(day => <div key={day}>{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">{days.map((day, index) => day ? <button type="button" key={dateKey(day)} onClick={() => setSelectedDate(day)} className={`min-h-14 p-2 rounded-md text-left hover:bg-gray-800 ${dateKey(day) === dateKey(selectedDate) ? 'ring-2 ring-[#4CAF50] bg-[#4CAF50]/10' : ''}`}><span className={dateKey(day) === dateKey(new Date()) ? 'bg-[#4CAF50] text-[#1A1D21] rounded-full px-1.5 py-0.5' : 'text-gray-300'}>{day.getDate()}</span>{eventsByDate[dateKey(day)]?.length ? <span className="block mt-2 h-1 w-1 rounded-full bg-blue-400" aria-label={`${eventsByDate[dateKey(day)].length} events`} /> : null}</button> : <div key={`blank-${index}`} />)}</div>
        </section>
        <section className="flex-1 min-w-0"><div className="flex justify-between items-center mb-4"><div><h3 className="font-semibold text-white">{readableDate(selectedDate)}</h3><p className="text-xs text-gray-500 mt-1">{selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}</p></div><button type="button" onClick={() => openCreate(selectedDate)} className="text-sm text-blue-400 hover:text-blue-300">Add event</button></div>{isLoading ? <div className="rounded-xl border border-gray-800 bg-[#1A1D21] p-8 text-center text-gray-500">Loading calendar…</div> : error && !form ? <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">{error}</div> : selectedEvents.length === 0 ? <div className="rounded-xl border border-dashed border-gray-700 bg-[#1A1D21] p-10 text-center text-gray-500"><CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-50" /><p>No events scheduled for this day.</p></div> : <div className="space-y-3">{selectedEvents.map(event => <div key={event.id} className="bg-[#1A1D21] border border-gray-800 rounded-xl p-4"><div className="flex justify-between gap-3"><div><h4 className="font-bold text-white">{event.title}</h4><p className="text-sm text-blue-300 mt-1 flex items-center"><Clock className="h-4 w-4 mr-1" />{readableTime(event.startAt)} – {readableTime(event.endAt)}</p>{event.location && <p className="text-sm text-gray-500 mt-2 flex items-center"><MapPin className="h-4 w-4 mr-1" />{event.location}</p>}{event.description && <p className="text-sm text-gray-400 mt-3 whitespace-pre-wrap">{event.description}</p>}</div><div className="flex gap-1"><button type="button" onClick={() => openEdit(event)} aria-label={`Edit ${event.title}`} className="p-2 text-gray-500 hover:text-white"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void removeEvent(event)} aria-label={`Delete ${event.title}`} className="p-2 text-gray-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></div></div>{event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center mt-3 text-sm text-blue-400 hover:text-blue-300">Join meeting <ExternalLink className="h-3.5 w-3.5 ml-1" /></a>}</div>)}</div>}</section>
      </div>
      {form && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit event' : 'New event'}><form onSubmit={saveEvent} className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#1A1D21] p-6 shadow-2xl space-y-4"><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-white">{editingId ? 'Edit event' : 'New event'}</h3><button type="button" onClick={closeForm} aria-label="Close" className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>{error && <p className="rounded bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}<label className="block text-sm text-gray-300">Title<input autoFocus required value={form.title} onChange={event => updateForm('title', event.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-[#222529] px-3 py-2 text-white" /></label><label className="block text-sm text-gray-300">Description<textarea value={form.description} onChange={event => updateForm('description', event.target.value)} rows={3} className="mt-1 w-full rounded border border-gray-700 bg-[#222529] px-3 py-2 text-white" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm text-gray-300">Starts<input type="datetime-local" required value={localInputValue(form.startAt)} onChange={event => updateForm('startAt', event.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-[#222529] px-2 py-2 text-white" /></label><label className="block text-sm text-gray-300">Ends<input type="datetime-local" required value={localInputValue(form.endAt)} onChange={event => updateForm('endAt', event.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-[#222529] px-2 py-2 text-white" /></label></div><div className="grid grid-cols-2 gap-3"><label className="block text-sm text-gray-300">Location<input value={form.location} onChange={event => updateForm('location', event.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-[#222529] px-3 py-2 text-white" /></label><label className="block text-sm text-gray-300">Meeting URL<input type="url" value={form.meetingUrl} onChange={event => updateForm('meetingUrl', event.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-[#222529] px-3 py-2 text-white" /></label></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeForm} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button><button type="submit" disabled={isSaving} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50">{isSaving ? 'Saving…' : 'Save event'}</button></div></form></div>}
    </div>
  );
}
