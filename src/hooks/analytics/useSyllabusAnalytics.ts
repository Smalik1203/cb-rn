// Typed hook for Syllabus analytics using direct table queries

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type {
  AnalyticsQueryFilters,
  SyllabusRow,
  RankedRow,
  SyllabusAggregation,
} from '../../lib/analytics-table-types';
import { analyticsUtils } from '../../lib/analytics-utils';

interface UseSyllabusAnalyticsOptions extends AnalyticsQueryFilters {
  limit?: number;
  classInstanceId?: string;
  subjectId?: string;
}

export function useSyllabusAnalytics(options: UseSyllabusAnalyticsOptions) {
  const { school_code, academic_year_id, start_date, end_date, limit, classInstanceId, subjectId } = options;

  return useQuery({
    queryKey: ['analytics', 'syllabus', school_code, academic_year_id, start_date, end_date, classInstanceId, subjectId, limit],
    queryFn: async () => {
      // 1. Fetch syllabus progress
      let progressQuery = supabase
        .from('syllabus_progress')
        .select(`
          id,
          chapter_id,
          class_instance_id,
          is_completed,
          completed_at,
          updated_at,
          syllabus_chapters!inner(
            id,
            title,
            subject_id,
            syllabi!inner(
              id,
              title,
              subject_id,
              subjects(id, name)
            )
          ),
          class_instances!inner(
            id,
            class_name,
            school_code,
            academic_year_id
          )
        `)
        .eq('class_instances.school_code', school_code)
        .eq('class_instances.academic_year_id', academic_year_id);

      if (classInstanceId) progressQuery = progressQuery.eq('class_instance_id', classInstanceId);
      if (subjectId) progressQuery = progressQuery.eq('syllabus_chapters.syllabi.subject_id', subjectId);

      const { data: progressData, error: progressError } = await progressQuery;

      if (progressError) throw progressError;

      // 2. Fetch all chapters to get total count per subject
      let chaptersQuery = supabase
        .from('syllabus_chapters')
        .select(`
          id,
          subject_id,
          syllabi!inner(
            id,
            subject_id,
            subjects(id, name)
          )
        `);

      if (subjectId) chaptersQuery = chaptersQuery.eq('syllabi.subject_id', subjectId);

      const { data: chaptersData, error: chaptersError } = await chaptersQuery;

      if (chaptersError) throw chaptersError;

      if (!progressData || !chaptersData || chaptersData.length === 0) {
        return {
          aggregation: {
            overallProgress: 0,
            totalSubjects: 0,
            completedSubjects: 0,
            subjectSummaries: [],
          },
          rankedRows: [],
        };
      }

      // 3. Group chapters by subject
      const chaptersBySubject = new Map<string, { subjectName: string; totalChapters: number }>();

      chaptersData.forEach((chapter: any) => {
        const subjectId = chapter.subject_id || chapter.syllabi.subject_id;
        const subjectName = chapter.syllabi.subjects.name;

        if (!chaptersBySubject.has(subjectId)) {
          chaptersBySubject.set(subjectId, {
            subjectName,
            totalChapters: 0,
          });
        }

        chaptersBySubject.get(subjectId)!.totalChapters++;
      });

      // 4. Aggregate progress by class and subject
      const classSubjectMap = new Map<string, SyllabusRow>();

      progressData.forEach((progress: any) => {
        const classId = progress.class_instance_id;
        const className = progress.class_instances.class_name;
        const subjectId = progress.syllabus_chapters.syllabi.subject_id;
        const subjectName = progress.syllabus_chapters.syllabi.subjects.name;
        const isCompleted = progress.is_completed;
        const updatedAt = progress.updated_at;

        const key = `${classId}-${subjectId}`;

        if (!classSubjectMap.has(key)) {
          const totalTopics = chaptersBySubject.get(subjectId)?.totalChapters || 0;

          classSubjectMap.set(key, {
            classId,
            className,
            subjectId,
            subjectName,
            completedTopics: isCompleted ? 1 : 0,
            totalTopics,
            progress: 0,
            lastUpdated: updatedAt,
          });
        } else {
          const existing = classSubjectMap.get(key)!;
          if (isCompleted) existing.completedTopics++;
          if (updatedAt > existing.lastUpdated!) existing.lastUpdated = updatedAt;
        }
      });

      // 5. Calculate progress percentages
      classSubjectMap.forEach((row) => {
        row.progress = analyticsUtils.calculatePercentage(row.completedTopics, row.totalTopics);
      });

      // 6. Fetch previous period data for trend
      const { startDate: prevStartDate, endDate: prevEndDate } = analyticsUtils.calculatePreviousPeriod(
        start_date,
        end_date
      );

      let prevProgressQuery = supabase
        .from('syllabus_progress')
        .select(`
          class_instance_id,
          is_completed,
          updated_at,
          syllabus_chapters!inner(
            syllabi!inner(subject_id)
          ),
          class_instances!inner(school_code, academic_year_id)
        `)
        .eq('class_instances.school_code', school_code)
        .eq('class_instances.academic_year_id', academic_year_id)
        .lte('updated_at', prevEndDate);

      if (classInstanceId) prevProgressQuery = prevProgressQuery.eq('class_instance_id', classInstanceId);
      if (subjectId) prevProgressQuery = prevProgressQuery.eq('syllabus_chapters.syllabi.subject_id', subjectId);

      const { data: prevProgressData } = await prevProgressQuery;

      const prevMap = new Map<string, { completed: number; total: number }>();

      prevProgressData?.forEach((progress: any) => {
        const key = `${progress.class_instance_id}-${progress.syllabus_chapters.syllabi.subject_id}`;

        if (!prevMap.has(key)) {
          const totalTopics = chaptersBySubject.get(progress.syllabus_chapters.syllabi.subject_id)?.totalChapters || 0;
          prevMap.set(key, { completed: 0, total: totalTopics });
        }

        if (progress.is_completed) prevMap.get(key)!.completed++;
      });

      // 7. Rank rows with trends
      const currentRows = Array.from(classSubjectMap.values());
      const previousRows = Array.from(prevMap.entries()).map(([key, stats]): SyllabusRow => {
        // Parse key back to classId-subjectId
        const [classId, subjectId] = key.split('-');
        const progress = analyticsUtils.calculatePercentage(stats.completed, stats.total);
        return {
          classId,
          className: '',
          subjectId,
          subjectName: '',
          completedTopics: stats.completed,
          totalTopics: stats.total,
          progress,
          lastUpdated: null,
        };
      });

      const rankedRows = analyticsUtils.rankRowsWithTrend(
        currentRows,
        previousRows,
        (row) => `${row.classId}-${row.subjectId}`,
        (row) => row.progress,
        'desc'
      );

      const limitedRows = limit ? rankedRows.slice(0, limit) : rankedRows;

      // 8. Calculate aggregation
      const overallProgress = analyticsUtils.calculateAverage(currentRows.map((r) => r.progress));
      const totalSubjects = new Set(currentRows.map((r) => r.subjectId)).size;
      const completedSubjects = currentRows.filter((r) => r.progress === 100).length;

      const aggregation: SyllabusAggregation = {
        overallProgress,
        totalSubjects,
        completedSubjects,
        subjectSummaries: currentRows,
      };

      return { aggregation, rankedRows: limitedRows };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!school_code && !!academic_year_id && !!start_date && !!end_date,
  });
}
