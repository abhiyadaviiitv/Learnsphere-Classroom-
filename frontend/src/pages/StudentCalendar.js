import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function StudentCalendar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [assignments, setAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [loading, setLoading] = useState(true);

    const id = localStorage.getItem('id');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Enrolled Classes
                const classesRes = await axios.get(`http://localhost:8080/api/classes/student/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClasses(classesRes.data);

                // Fetch All Assignments for all classes
                // We will fetch assignments for each class and merge them.
                // It would be better to have a "get all assignments for student" endpoint, but we can iterate.
                const classIds = classesRes.data.map(c => c.id);
                const assignmentsPromises = classIds.map(classId =>
                    axios.get(`http://localhost:8080/api/assignments/${classId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(err => ({ data: [] })) // Handle individual failures gracefully
                );

                const assignmentsResponses = await Promise.all(assignmentsPromises);
                let allAssignments = assignmentsResponses.flatMap(res => res.data || []);

                // Add class info to assignments if possible (not strictly necessary but good for UI)
                // We can match by classId if assignment has it.
                allAssignments = allAssignments.map(a => {
                    const cls = classesRes.data.find(c => c.id === a.classId);
                    return { ...a, className: cls ? cls.name : 'Class' };
                });

                setAssignments(allAssignments);

            } catch (err) {
                console.error('Error fetching calendar data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const filteredAssignments = selectedClass === 'all'
        ? assignments
        : assignments.filter(a => a.classId === selectedClass);

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-gray-900">Calendar</h1>
                    <p className="text-gray-600 mt-1">Keep track of your deadlines</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="input-field min-w-[200px]"
                    >
                        <option value="all">All Classes</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 font-semibold text-gray-900 min-w-[140px] text-center">
                            {format(currentMonth, 'MMMM yyyy')}
                        </div>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const dateFormat = "EEEE";
        const days = [];
        let startDate = startOfWeek(currentMonth);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="col-span-1 text-center text-sm font-semibold text-gray-500 py-2 uppercase tracking-wider" key={i}>
                    {format(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i), dateFormat)}
                </div>
            );
        }

        return <div className="grid grid-cols-7 mb-2 border-b border-gray-200 pb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        const daysInInterval = eachDayOfInterval({
            start: startDate,
            end: endDate
        });

        daysInInterval.forEach((dayItem) => {
            formattedDate = format(dayItem, dateFormat);
            const dayAssignments = filteredAssignments.filter(a =>
                isSameDay(parseISO(a.dueDate), dayItem)
            );

            days.push(
                <div
                    className={`col-span-1 min-h-[120px] bg-white border border-gray-100 p-2 relative group transition-all hover:bg-gray-50
                ${!isSameMonth(dayItem, monthStart) ? "bg-gray-50/50 text-gray-400" : "text-gray-900"}
                ${isSameDay(dayItem, new Date()) ? "ring-2 ring-primary-500 ring-inset" : ""}
              `}
                    key={dayItem}
                    onClick={() => setSelectedDate(dayItem)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isSameDay(dayItem, new Date()) ? "bg-primary-500 text-white" : ""}
                 `}>{formattedDate}</span>
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayAssignments.map((assignment, idx) => (
                            <div
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/assignment/${assignment.id}`);
                                }}
                                className="text-xs p-1.5 rounded bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100 cursor-pointer truncate"
                                title={assignment.title}
                            >
                                {assignment.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        });

        return <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">{days}</div>;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar classes={[]} userRole="STUDENT" />
                <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar classes={classes} userRole="STUDENT" />
            <main className="flex-1 ml-64 p-8">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </main>
        </div>
    );
}

export default StudentCalendar;
