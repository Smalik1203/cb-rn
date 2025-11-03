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
  
  const progressColor = overallProgress >= 75 ? colors.success[600] :
                       overallProgress >= 50 ? colors.warning[600] : colors.error[600];

  const subjectData = data?.syllabus?.progressBySubject?.map(subject => {
    const subjectColor = subject.progress >= 75 ? colors.success[600] :
                         subject.progress >= 50 ? colors.warning[600] : colors.error[600];
    return {
      id: subject.subjectId,
      label: subject.subjectName,
      value: subject.progress,
      color: subjectColor,
      subtext: `${subject.completedTopics}/${subject.totalTopics} topics`,
    };
  }) || [];

  const classData = data?.syllabus?.progressByClass?.map(classItem => {
    const classColor = classItem.progress >= 75 ? colors.success[600] :
                      classItem.progress >= 50 ? colors.warning[600] : colors.error[600];
    return {
      id: classItem.classId,
      label: classItem.className,
      value: classItem.progress,
      color: classColor,
    };
  }) || [];

  return (
    <>
      <TimePeriodFilter timePeriod={timePeriod} setTimePeriod={setTimePeriod} />

      <MetricCard
        label="Overall Syllabus Progress"
        value={`${Math.round(overallProgress)}%`}
        subtext="School-wide completion"
        valueColor={progressColor}
      />

      {subjectData.length > 0 && (
        <ComparisonChart
          title="Progress by Subject"
          subtitle="Completion across all subjects"
          items={subjectData}
        />
      )}

      {classData.length > 0 && (
        <ComparisonChart
          title="Progress by Class"
          subtitle="Completion across all classes"
          items={classData}
        />
      )}
    </>
  );
};

