import {
  ExamRoom,
  Seat,
  Exam,
  Student,
  Assignment,
  Ticket,
  ConflictLog,
} from "@/types";

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const buildings = ["教学楼A", "教学楼B", "实验楼C", "综合楼D"];
const schools = [
  "第一中学",
  "第二中学",
  "第三中学",
  "实验中学",
  "育才学校",
  "新华中学",
  "阳光中学",
  "希望学校",
];
const surnames = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡"];
const givenNames = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "洋", "艳", "勇", "军", "杰", "娟", "涛"];
const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"];

export const generateMockExamRooms = (): ExamRoom[] => {
  const rooms: ExamRoom[] = [];
  for (let i = 1; i <= 6; i++) {
    const rows = 6 + Math.floor(Math.random() * 3);
    const cols = 5 + Math.floor(Math.random() * 3);
    rooms.push({
      id: generateId(),
      name: `${i}号考场`,
      building: buildings[i % buildings.length],
      floor: (i % 3) + 1,
      rows,
      cols,
      totalSeats: rows * cols,
      createdAt: new Date(),
    });
  }
  return rooms;
};

export const generateSeatsForRoom = (room: ExamRoom): Seat[] => {
  const seats: Seat[] = [];
  for (let r = 1; r <= room.rows; r++) {
    for (let c = 1; c <= room.cols; c++) {
      seats.push({
        id: generateId(),
        roomId: room.id,
        seatNo: `${r}排${c}号`,
        rowNum: r,
        colNum: c,
        status: Math.random() > 0.9 ? "disabled" : "available",
        isLocked: false,
      });
    }
  }
  return seats;
};

export const generateMockSeats = (rooms: ExamRoom[]): Seat[] => {
  const seats: Seat[] = [];
  rooms.forEach((room) => {
    seats.push(...generateSeatsForRoom(room));
  });
  return seats;
};

export const generateMockExams = (): Exam[] => {
  const exams: Exam[] = [];
  const baseDate = new Date();
  for (let i = 0; i < 4; i++) {
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + i + 1);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 120);
    exams.push({
      id: generateId(),
      name: `2026年夏季学业水平考试 - 第${i + 1}场`,
      subject: subjects[i % subjects.length],
      startTime: startDate,
      endTime: endDate,
      duration: 120,
      status: i === 0 ? "ongoing" : i < 2 ? "upcoming" : "completed",
    });
  }
  return exams;
};

export const generateMockStudents = (exams: Exam[], count: number = 150): Student[] => {
  const students: Student[] = [];
  for (let i = 0; i < count; i++) {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    const exam = exams[Math.floor(Math.random() * exams.length)];
    students.push({
      id: generateId(),
      name: `${surname}${givenName}`,
      idCard: `3201${Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(14, "0")}`,
      school: schools[Math.floor(Math.random() * schools.length)],
      examId: exam.id,
    });
  }
  return students;
};

export const generateMockAssignments = (): Assignment[] => [];
export const generateMockTickets = (): Ticket[] => [];
export const generateMockConflicts = (): ConflictLog[] => [];

export const initMockData = () => {
  const rooms = generateMockExamRooms();
  const seats = generateMockSeats(rooms);
  const exams = generateMockExams();
  const students = generateMockStudents(exams);

  return {
    examRooms: rooms,
    seats,
    exams,
    students,
    assignments: generateMockAssignments(),
    tickets: generateMockTickets(),
    conflicts: generateMockConflicts(),
  };
};
