'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  Calendar,
  Save,
  UserCheck,
  UserX,
  AlertCircle,
  ChevronDown,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDataStore } from '@/store/data';
import { useAuthStore } from '@/store/auth';

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  timestamp?: Date;
  note?: string;
}

interface LessonAttendance {
  lessonId: string;
  date: string;
  records: AttendanceRecord[];
  isCompleted: boolean;
}

export default function PresencePage() {
  const { students, lessons } = useDataStore();
  const { teacher } = useAuthStore();
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showLessonDropdown, setShowLessonDropdown] = useState(false);

  // Get today's lessons
  const todayLessons = lessons.filter(lesson => {
    const today = new Date().toDateString();
    return new Date(lesson.date).toDateString() === today;
  });

  // Filter students based on selected lesson and search term
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!selectedLesson) return matchesSearch;
    
    const lesson = lessons.find(l => l.id === selectedLesson);
    return matchesSearch && lesson?.attendeeIds.includes(student.id);
  });

  // Initialize attendance when lesson is selected
  useEffect(() => {
    if (selectedLesson) {
      const lesson = lessons.find(l => l.id === selectedLesson);
      if (lesson) {
        const lessonStudents = students.filter(s => lesson.attendeeIds.includes(s.id));
        setAttendance(lessonStudents.map(student => ({
          studentId: student.id,
          status: 'present' as const
        })));
      }
    }
  }, [selectedLesson, students, lessons]);

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => prev.map(record => 
      record.studentId === studentId 
        ? { ...record, status, timestamp: new Date() }
        : record
    ));
  };

  const handleSave = () => {
    // Here you would save to your backend
    console.log('Saving attendance:', {
      lessonId: selectedLesson,
      date: new Date().toISOString(),
      records: attendance
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <UserCheck className="h-4 w-4" />;
      case 'absent': return <UserX className="h-4 w-4" />;
      case 'late': return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const attendanceStats = {
    present: attendance.filter(r => r.status === 'present').length,
    absent: attendance.filter(r => r.status === 'absent').length,
    late: attendance.filter(r => r.status === 'late').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Présence des étudiants
          </h1>
          <p className="text-gray-600 mt-2">
            Marquez facilement la présence de vos étudiants
          </p>
        </div>
        {selectedLesson && (
          <Button 
            onClick={handleSave}
            className={`px-6 py-2 transition-all duration-300 ${
              isSaved ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
            disabled={!attendance.length}
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sauvegardé
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        )}
      </div>

      {/* Lesson Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Sélectionner un cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowLessonDropdown(!showLessonDropdown)}
              className="w-full justify-between text-left"
            >
              {selectedLesson ? (
                lessons.find(l => l.id === selectedLesson)?.title || 'Cours sélectionné'
              ) : (
                'Choisir un cours d\'aujourd\'hui'
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {showLessonDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                {todayLessons.length > 0 ? (
                  todayLessons.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setSelectedLesson(lesson.id);
                        setShowLessonDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0"
                    >
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-sm text-gray-500">
                        {lesson.startTime} • Groupe: {lesson.groupId}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    Aucun cours prévu aujourd'hui
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedLesson && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Présents</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absents</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En retard</p>
                    <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Liste des étudiants ({filteredStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStudents.map((student, index) => {
                  const studentAttendance = attendance.find(a => a.studentId === student.id);
                  const status = studentAttendance?.status || 'present';
                  
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          {status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : 'En retard'}
                        </span>
                        
                        {/* Quick Action Buttons */}
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant={status === 'present' ? 'default' : 'outline'}
                            onClick={() => updateAttendance(student.id, 'present')}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'late' ? 'default' : 'outline'}
                            onClick={() => updateAttendance(student.id, 'late')}
                            className="h-8 w-8 p-0"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'absent' ? 'default' : 'outline'}
                            onClick={() => updateAttendance(student.id, 'absent')}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucun étudiant trouvé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}