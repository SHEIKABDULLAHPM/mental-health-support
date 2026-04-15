import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { AnalysisResult } from '../models/AnalysisResult.js';
import { ReportLog } from '../models/ReportLog.js';

export async function listUsers(req, res) {
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
  return res.json({ status: 'success', data: users });
}

export async function listConversations(req, res) {
  const rows = await Conversation.find({}).populate('userId', 'fullName email username role').sort({ updatedAt: -1 }).limit(500);
  return res.json({ status: 'success', data: rows });
}

export async function analytics(req, res) {
  const [users, conversations, analyses, logs] = await Promise.all([
    User.countDocuments({}),
    Conversation.countDocuments({}),
    AnalysisResult.countDocuments({}),
    ReportLog.countDocuments({}),
  ]);

  return res.json({
    status: 'success',
    data: {
      totals: { users, conversations, analyses, logs },
      generatedAt: new Date().toISOString(),
    },
  });
}

export async function logs(req, res) {
  const rows = await ReportLog.find({}).sort({ createdAt: -1 }).limit(500);
  return res.json({ status: 'success', data: rows });
}
