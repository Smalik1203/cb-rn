import React from 'react';
import { colors } from '../../../../../lib/design-system';
import { SuperAdminAnalytics, TimePeriod } from '../../types';
import { TimePeriodFilter, MetricCard, ComparisonChart } from '../../shared';

interface SyllabusProgressDetailViewProps {
  data: SuperAdminAnalytics;
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
}

export const SyllabusProgressDetailView: React.FC<SyllabusProgressDetailViewProps> = ({
  data,
  timePeriod,
  setTimePeriod,
}) => {
  const overallProgress = data?.syllabus?.overallProgress || 0;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return colors.success[600];
    if (progress >= 50) return colors.info[600];
    return colors.warning[600];
  };

  const subjectData = data?.syllabus?.progressBySubject?.map(subject => {
    const subjectColor = getProgressColor(subject.progress);
    return {
      id: subject.subjectId,
      label: subject.subjectName,
      value: subject.progress,
      color: subjectColor,
      subtext: `${subject.completedTopics}/${subject.totalTopics} topics`,
    };
  }) || [];

  const classData = data?.syllabus?.progressByClass?.map(classItem => {
    const classColor = getProgressColor(classItem.progress);
    return {
      id: classItem.classId,
      label: classItem.className,
      value: classItem.progress,
      color: classColor,
      subtext: `${classItem.className} progress`,
    };
  }) || [];

  return (
    <>
      <TimePeriodFilter timePeriod={timePeriod} setTimePeriod={setTimePeriod} />

      <MetricCard
        label="Overall Syllabus Progress"
        value={`${Math.round(overallProgress)}%`}
        subtext="School-wide completion"
        progress={overallProgress}
        variant="ring"
      />

      {subjectData.length > 0 && (
        <ComparisonChart
          title="Progress by Subject"
          subtitle="Completion across all subjects"
          items={subjectData}
          variant="syllabus"
        />
      )}

      {classData.length > 0 && (
        <ComparisonChart
          title="Progress by Class"
          subtitle="Completion across all classes"
          items={classData}
          variant="syllabus"
        />
      )}
    </>
  );
};

