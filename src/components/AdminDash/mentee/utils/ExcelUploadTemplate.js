import { utils } from 'xlsx';

export const sampleMenteeData = [
  {
    'Mentee MUJid': 'MUJ2023001',
    'Mentee Name': 'John Doe',
    'Mentee Email': 'john.doe@example.com',
    'Year Of Registration': '2024',
    'Semester': '2',
    'Backlogs': '0',
    'CGPA': '9.0',
    'Mentee Phone Numer': '9876543210',
    'Mentee Address': '123 Main St, Jaipur',
    "Mentee's Father Name": 'Richard Doe',
    "Mentee's Father Phone": '9876543211',
    "Mentee's Father Email": 'richard.doe@example.com',
    "Mentee's Mother Name": 'Jane Doe',
    "Mentee's Mother Phone": '9876543212',
    "Mentee's Mother Email": 'jane.doe@example.com',
    "Mentee's Guardian Name": 'Uncle Doe',
    "Mentee's Guardian Phone": '9876543213',
    "Mentee's Guardian Email": 'guardian.doe@example.com',
    'Assigned Mentor Email': 'gaurav.12bhindwar@gmail.com'
  }
];

export const menteeHeaders = [
  'Mentee MUJid',
  'Mentee Name',
  'Mentee Email',
  'Year Of Registration',
  'Semester',
  'Backlogs',
  'CGPA',
  'Mentee Phone Numer',
  'Mentee Address',
  "Mentee's Father Name",
  "Mentee's Father Phone",
  "Mentee's Father Email",
  "Mentee's Mother Name",
  "Mentee's Mother Phone",
  "Mentee's Mother Email",
  "Mentee's Guardian Name",
  "Mentee's Guardian Phone",
  "Mentee's Guardian Email",
  'Assigned Mentor Email'
];

export const columnWidths = menteeHeaders.map(header => ({
  wch: Math.max(header.length, 15)
}));

export const getTemplateWorkbook = () => {
  const wb = utils.book_new();
  const ws = utils.json_to_sheet(sampleMenteeData, { header: menteeHeaders });
  ws['!cols'] = columnWidths;
  utils.book_append_sheet(wb, ws, 'Template');
  return wb;
};
