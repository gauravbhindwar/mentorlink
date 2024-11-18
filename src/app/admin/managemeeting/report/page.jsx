
'use client';
import { useSearchParams } from 'next/navigation';
import MeetingReportGenerator from '@/components/Meetings/MeetingReportGenerator';

const MeetingsReportPage = () => {
  const searchParams = useSearchParams();
  const queryParams = {
    year: searchParams.get('year'),
    session: searchParams.get('session'),
    semester: searchParams.get('semester'),
    section: searchParams.get('section'),
    mentorId: searchParams.get('mentorId')
  };

  return <MeetingReportGenerator initialParams={queryParams} />;
};

export default MeetingsReportPage;