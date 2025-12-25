const DB_KEY = 'studygo_db';

const defaultData = {
      subjects: [
            {
                  id: 'sub_1',
                  name: 'Mathematics',
                  color: '#6366f1', // Indigo
                  topics: [
                        { id: 't_1', name: 'Algebra', targetHours: 5, spentHours: 0 },
                        { id: 't_2', name: 'Calculus', targetHours: 8, spentHours: 0 }
                  ]
            },
            {
                  id: 'sub_2',
                  name: 'Physics',
                  color: '#ec4899',    // Pink
                  topics: [
                        { id: 't_3', name: 'Mechanics', targetHours: 4, spentHours: 0 }
                  ]
            },
            {
                  id: 'sub_3',
                  name: 'Literature',
                  color: '#10b981', // Emerald
                  topics: []
            },
            {
                  id: 'sub_4',
                  name: 'Computer Science',
                  color: '#f59e0b', // Amber
                  topics: []
            }
      ],
      sessions: [], // { id, subjectId, topicId, duration (sec), timestamp }
      settings: {
            darkMode: true,
            weeklyGoal: 10 // Default global weekly goal (hours)
      }
};

export const getDB = () => {
      const data = localStorage.getItem(DB_KEY);
      if (!data) {
            saveDB(defaultData);
            return defaultData;
      }
      return JSON.parse(data);
};

export const saveDB = (data) => {
      localStorage.setItem(DB_KEY, JSON.stringify(data));
};

export const updateSettings = (settings) => {
      const db = getDB();
      db.settings = { ...(db.settings || defaultData.settings), ...settings };
      saveDB(db);
};

export const addSession = (session) => {
      const db = getDB();
      db.sessions.push(session);

      // Update Subject/Topic Spent Hours
      const subject = db.subjects.find(s => s.id === session.subjectId);
      if (subject) {
            if (session.topicId) {
                  const topic = subject.topics.find(t => t.id === session.topicId);
                  if (topic) {
                        topic.spentHours = (topic.spentHours || 0) + (session.duration / 3600);
                  }
            }
      }
      saveDB(db);
};

export const getSubjects = () => {
      return getDB().subjects;
};

// Topic Management
export const addTopic = (subjectId, topicName, targetHours) => {
      const db = getDB();
      const subject = db.subjects.find(s => s.id === subjectId);
      if (subject) {
            if (!subject.topics) subject.topics = [];
            subject.topics.push({
                  id: 't_' + Date.now(),
                  name: topicName,
                  targetHours: parseFloat(targetHours) || 0,
                  spentHours: 0
            });
            saveDB(db);
      }
};

export const deleteTopic = (subjectId, topicId) => {
      const db = getDB();
      const subject = db.subjects.find(s => s.id === subjectId);
      if (subject && subject.topics) {
            subject.topics = subject.topics.filter(t => t.id !== topicId);
            saveDB(db);
      }
};

export const updateSubjectColor = (subjectId, color) => {
      const db = getDB();
      const subject = db.subjects.find(s => s.id === subjectId);
      if (subject) {
            subject.color = color;
            saveDB(db);
      }
};
