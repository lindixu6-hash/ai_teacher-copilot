/**
 * 导出功能
 * 支持导出为 Markdown 和 JSON 格式
 */

import { LessonPlan, Question, QualityCheck, ExportFormat } from '@/types';

/**
 * 导出为 Markdown 格式
 */
export function exportToMarkdown(params: {
  lessonPlan: LessonPlan;
  questions?: Question[];
  qualityCheck?: QualityCheck;
}): string {
  const { lessonPlan, questions = [], qualityCheck } = params;
  const content = lessonPlan.content;

  // 年级显示名称
  const gradeNames: Record<string, string> = {
    'primary-1': '小学一年级', 'primary-2': '小学二年级', 'primary-3': '小学三年级',
    'primary-4': '小学四年级', 'primary-5': '小学五年级', 'primary-6': '小学六年级',
    'junior-1': '初中一年级', 'junior-2': '初中二年级', 'junior-3': '初中三年级',
    'senior-1': '高中一年级', 'senior-2': '高中二年级', 'senior-3': '高中三年级',
  };

  // 学科显示名称
  const subjectNames: Record<string, string> = {
    'chinese': '语文', 'math': '数学', 'english': '英语',
    'physics': '物理', 'chemistry': '化学', 'biology': '生物',
    'history': '历史', 'geography': '地理', 'morality': '道德与法治',
  };

  const gradeLabel = gradeNames[lessonPlan.grade] || lessonPlan.grade;
  const subjectLabel = subjectNames[lessonPlan.subject] || lessonPlan.subject;
  const dateStr = new Date().toLocaleDateString('zh-CN');

  let markdown = `# 《${lessonPlan.topic}》教学设计\n\n`;
  markdown += `**年级**: ${gradeLabel}  \n`;
  markdown += `**学科**: ${subjectLabel}  \n`;
  if (lessonPlan.textbook) {
    markdown += `**教材版本**: ${lessonPlan.textbook}  \n`;
  }
  markdown += `**课时**: ${lessonPlan.duration}分钟  \n`;
  markdown += `**生成时间**: ${dateStr}\n\n`;

  markdown += `---\n\n`;

  // 教学目标
  markdown += `## 一、教学目标\n\n`;
  markdown += `### 1. 知识与技能\n${content.objectives.knowledge}\n\n`;
  markdown += `### 2. 过程与方法\n${content.objectives.process}\n\n`;
  markdown += `### 3. 情感态度与价值观\n${content.objectives.emotion}\n\n`;

  // 教学重难点
  markdown += `## 二、教学重难点\n\n`;
  markdown += `**重点**: ${content.keyPoints.key}\n\n`;
  markdown += `**难点**: ${content.keyPoints.difficulty}\n\n`;

  // 教学准备
  if (content.preparation.teaching.length > 0 || content.preparation.learning.length > 0) {
    markdown += `## 三、教学准备\n\n`;
    if (content.preparation.teaching.length > 0) {
      markdown += `**教具**: ${content.preparation.teaching.join('、')}\n\n`;
    }
    if (content.preparation.learning.length > 0) {
      markdown += `**学具**: ${content.preparation.learning.join('、')}\n\n`;
    }
  }

  // 教学流程
  markdown += `## 四、教学流程\n\n`;
  for (const stage of content.process) {
    markdown += `### ${stage.stage}（${stage.duration}分钟）\n\n`;
    markdown += `${stage.content}\n\n`;
  }

  // 板书设计
  markdown += `## 五、板书设计\n\n`;
  markdown += '```\n';
  markdown += `${content.boardDesign}\n`;
  markdown += '```\n\n';

  // 作业布置
  markdown += `## 六、作业布置\n\n`;
  markdown += `${content.homework}\n\n`;

  // 题目（如果有）
  if (questions.length > 0) {
    markdown += `---\n\n`;
    markdown += `# 课后练习\n\n`;

    // 按题型分组
    const choiceQuestions = questions.filter(q => q.type === 'choice');
    const fillQuestions = questions.filter(q => q.type === 'fill');
    const shortQuestions = questions.filter(q => q.type === 'short');

    // 选择题
    if (choiceQuestions.length > 0) {
      markdown += `## 一、选择题\n\n`;
      choiceQuestions.forEach((q, i) => {
        markdown += `${i + 1}. ${q.content}\n`;
        if (q.options) {
          q.options.forEach((opt, j) => {
            markdown += `   ${String.fromCharCode(65 + j)}. ${opt}\n`;
          });
        }
        markdown += `   **答案**: ${q.answer}\n`;
        markdown += `   **解析**: ${q.explanation}\n\n`;
      });
    }

    // 填空题
    if (fillQuestions.length > 0) {
      markdown += `## 二、填空题\n\n`;
      fillQuestions.forEach((q, i) => {
        markdown += `${i + 1}. ${q.content}\n`;
        markdown += `   **答案**: ${q.answer}\n`;
        markdown += `   **解析**: ${q.explanation}\n\n`;
      });
    }

    // 简答题
    if (shortQuestions.length > 0) {
      markdown += `## 三、简答题\n\n`;
      shortQuestions.forEach((q, i) => {
        markdown += `${i + 1}. ${q.content}\n`;
        markdown += `   **答案**: ${q.answer}\n`;
        markdown += `   **解析**: ${q.explanation}\n\n`;
      });
    }
  }

  // 质量检查报告（如果有）
  if (qualityCheck) {
    markdown += `---\n\n`;
    markdown += `# 质量检查报告\n\n`;
    markdown += `**目标覆盖率**: ${qualityCheck.coverageScore}%\n\n`;
    markdown += `**难度分布**: \n`;
    markdown += `- 基础: ${qualityCheck.difficultyDistribution.basic}%\n`;
    markdown += `- 进阶: ${qualityCheck.difficultyDistribution.intermediate}%\n`;
    markdown += `- 挑战: ${qualityCheck.difficultyDistribution.advanced}%\n\n`;
    markdown += `**总体评价**: ${qualityCheck.summary}\n\n`;

    if (qualityCheck.issues.length > 0) {
      markdown += `**问题与建议**:\n\n`;
      qualityCheck.issues.forEach((issue, i) => {
        const emoji = issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : 'ℹ️';
        markdown += `${i + 1}. ${emoji} ${issue.message}\n`;
        if (issue.suggestion) {
          markdown += `   **建议**: ${issue.suggestion}\n`;
        }
        markdown += `\n`;
      });
    }
  }

  return markdown;
}

/**
 * 导出为 JSON 格式
 */
export function exportToJSON(params: {
  lessonPlan: LessonPlan;
  questions?: Question[];
  qualityCheck?: QualityCheck;
}): string {
  return JSON.stringify(params, null, 2);
}

/**
 * 触发文件下载
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  // 创建 Blob
  const blob = new Blob([content], { type: mimeType });

  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 生成文件名
 */
export function generateFilename(lessonPlan: LessonPlan, format: ExportFormat): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const subject = lessonPlan.subject === 'chinese' ? '语文' :
                  lessonPlan.subject === 'math' ? '数学' :
                  lessonPlan.subject === 'english' ? '英语' :
                  lessonPlan.subject === 'physics' ? '物理' :
                  lessonPlan.subject === 'chemistry' ? '化学' :
                  lessonPlan.subject === 'biology' ? '生物' :
                  lessonPlan.subject === 'history' ? '历史' :
                  lessonPlan.subject === 'geography' ? '地理' : '道德与法治';
  const ext = format === 'markdown' ? 'md' : 'json';

  // 清理课题中的特殊字符
  const cleanTopic = lessonPlan.topic.replace(/[<>:"/\\|?*]/g, '-');

  return `${subject}_${cleanTopic}_${dateStr}.${ext}`;
}

/**
 * 导出并下载
 */
export function exportAndDownload(params: {
  lessonPlan: LessonPlan;
  questions?: Question[];
  qualityCheck?: QualityCheck;
  format: ExportFormat;
}): void {
  const { lessonPlan, questions, qualityCheck, format } = params;

  let content: string;
  let mimeType: string;

  if (format === 'markdown') {
    content = exportToMarkdown({ lessonPlan, questions, qualityCheck });
    mimeType = 'text/markdown';
  } else {
    content = exportToJSON({ lessonPlan, questions, qualityCheck });
    mimeType = 'application/json';
  }

  const filename = generateFilename(lessonPlan, format);
  downloadFile(content, filename, mimeType);
}
