import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- Local Fallback for Settings (Non-critical) ---
const DB_KEY = 'studygo_db';
const defaultSettings = {
      darkMode: true,
      weeklyGoal: 10
};

export const getLocalSettings = () => {
      const data = localStorage.getItem(DB_KEY);
      if (!data) return defaultSettings;
      return JSON.parse(data).settings || defaultSettings;
};

export const saveLocalSettings = (settings) => {
      const data = localStorage.getItem(DB_KEY) || JSON.stringify({ settings: defaultSettings });
      const db = JSON.parse(data);
      db.settings = settings;
      localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// --- Supabase Data Logic ---

/**
 * Fetches all data for the current user including subjects, topics, and sessions.
 * Note: Components will need to be updated to handled Async data.
 */
export const getDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { subjects: [], sessions: [], settings: getLocalSettings() };

      // Fetch subjects with topics
      const { data: subjects, error: subError } = await supabase
            .from('subjects')
            .select(`
                  *,
                  topics (*)
            `)
            .order('created_at', { ascending: true });

      // Fetch sessions
      const { data: sessions, error: sessError } = await supabase
            .from('sessions')
            .select('*')
            .order('timestamp', { ascending: false });

      // Fetch Profile/Settings
      const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .single();

      return {
            subjects: subjects || [],
            sessions: sessions || [],
            settings: {
                  ...(profile || getLocalSettings()),
                  username: profile?.username || user.user_metadata?.username || "Learner"
            }
      };
};

export const updateSettings = async (settings) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
            saveLocalSettings(settings);
            return;
      }

      await supabase.from('profiles').upsert({
            id: user.id,
            ...settings,
            updated_at: new Date()
      });
};

export const addSession = async (session) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('sessions').insert({
            user_id: user.id,
            subject_id: session.subjectId,
            topic_id: session.topicId,
            duration: session.duration,
            timestamp: new Date(session.timestamp).toISOString()
      });

      if (error) console.error('Error adding session:', error);
};

export const getSubjects = async () => {
      const { data, error } = await supabase
            .from('subjects')
            .select('*, topics(*)');
      return data || [];
};

export const addSubject = async (name, color) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('subjects').insert({
            user_id: user.id,
            name,
            color
      }).select().single();

      return data;
};

export const deleteSubject = async (id) => {
      await supabase.from('subjects').delete().eq('id', id);
};

// Topic Management
export const addTopic = async (subjectId, topicName, targetHours) => {
      const { data, error } = await supabase.from('topics').insert({
            subject_id: subjectId,
            name: topicName,
            target_hours: parseFloat(targetHours) || 0,
            spent_hours: 0
      }).select().single();

      return data;
};

export const deleteTopic = async (subjectId, topicId) => {
      // subjectId is reinforced by RLS but topicId is the primary key
      await supabase.from('topics').delete().eq('id', topicId);
};

export const updateSubjectColor = async (subjectId, color) => {
      await supabase.from('subjects').update({ color }).eq('id', subjectId);
};
