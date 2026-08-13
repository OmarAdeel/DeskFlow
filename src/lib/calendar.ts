import { supabase } from './supabase';
import type { CalendarEvent, CalendarEventInput } from '../types';

const calendarEventColumns = 'id,owner_id,organization_id,title,description,start_at,end_at,timezone,location,meeting_url,created_at,updated_at';

type CalendarEventRow = {
  id: string;
  owner_id: string;
  organization_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  location: string | null;
  meeting_url: string | null;
  created_at: string;
  updated_at: string;
};

function mapCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description || undefined,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    location: row.location || undefined,
    meetingUrl: row.meeting_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRow(input: CalendarEventInput) {
  return {
    owner_id: input.ownerId,
    organization_id: input.organizationId || null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    start_at: input.startAt,
    end_at: input.endAt,
    timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    location: input.location?.trim() || null,
    meeting_url: input.meetingUrl?.trim() || null
  };
}

export async function listCalendarEvents(
  ownerId: string,
  organizationId: string | null,
  rangeStart: string,
  rangeEnd: string
): Promise<{ data: CalendarEvent[]; error: string | null }> {
  let query = supabase
    .from('calendar_events')
    .select(calendarEventColumns)
    .eq('owner_id', ownerId)
    .lt('start_at', rangeEnd)
    .gt('end_at', rangeStart)
    .order('start_at', { ascending: true });

  query = organizationId === null
    ? query.is('organization_id', null)
    : query.eq('organization_id', organizationId);

  const { data, error } = await query;
  return {
    data: data ? (data as CalendarEventRow[]).map(mapCalendarEvent) : [],
    error: error?.message || null
  };
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<{ data: CalendarEvent | null; error: string | null }> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(toRow(input))
    .select(calendarEventColumns)
    .single();

  return {
    data: data ? mapCalendarEvent(data as CalendarEventRow) : null,
    error: error?.message || null
  };
}

export async function updateCalendarEvent(id: string, input: CalendarEventInput): Promise<{ data: CalendarEvent | null; error: string | null }> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(toRow(input))
    .eq('id', id)
    .eq('owner_id', input.ownerId)
    .select(calendarEventColumns)
    .single();

  return {
    data: data ? mapCalendarEvent(data as CalendarEventRow) : null,
    error: error?.message || null
  };
}

export async function deleteCalendarEvent(id: string, ownerId: string): Promise<string | null> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);

  return error?.message || null;
}
