import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  FileText,
  Calendar,
  Hash,
  CheckCircle2,
  Upload,
  Save,
  Eye,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import * as Dialog from '@radix-ui/react-dialog';

const assignmentTypes = [
  { value: 'homework', label: 'Homework' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'test', label: 'Test' },
  { value: 'project', label: 'Project' },
  { value: 'lab', label: 'Lab' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'other', label: 'Other' }
];

function AssignmentCreator() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Information', 'Content & Resources', 'Review & Publish'];
  
  // Form state - using individual state to prevent unnecessary re-renders
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [points, setPoints] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [questions, setQuestions] = useState([{ id: 1, text: '', points: 5, expectedAnswer: '' }]);
  const [files, setFiles] = useState([]);
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(true);
  const [latePenalty, setLatePenalty] = useState(10);
  const [showPointsToStudents, setShowPointsToStudents] = useState(true);
  const [allowAttachments, setAllowAttachments] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  
  // Validation state - only update on blur, not on every keystroke
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiQuestionType, setAiQuestionType] = useState('mixed');
  const [aiNumberOfQuestions, setAiNumberOfQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // Memoized validation - only runs when needed
  const validateField = useCallback((field, value) => {
    const newErrors = { ...errors };
    
    switch(field) {
      case 'title':
        if (!value || value.trim() === '') {
          newErrors.title = 'Title is required';
        } else if (value.length > 100) {
          newErrors.title = 'Title must be less than 100 characters';
        } else {
          delete newErrors.title;
        }
        break;
      case 'type':
        if (!value || value.trim() === '') {
          newErrors.type = 'Assignment type is required';
        } else {
          delete newErrors.type;
        }
        break;
      case 'points':
        if (value === '' || isNaN(Number(value))) {
          newErrors.points = 'Must be a number';
        } else if (Number(value) <= 0) {
          newErrors.points = 'Must be greater than 0';
        } else if (Number(value) > 1000) {
          newErrors.points = 'Must be less than or equal to 1000';
        } else {
          delete newErrors.points;
        }
        break;
      case 'dueDate':
        if (!dueDate || !dueTime) {
          newErrors.dueDate = 'Due date and time are required';
        } else {
          const dateTime = new Date(`${dueDate}T${dueTime}`);
          if (dateTime < new Date()) {
            newErrors.dueDate = 'Due date cannot be in the past';
          } else {
            delete newErrors.dueDate;
          }
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return !newErrors[field];
  }, [errors, dueDate, dueTime]);

  // Handle field changes - NO validation on change, only update state
  const handleFieldChange = useCallback((field, value) => {
    switch(field) {
      case 'title': setTitle(value); break;
      case 'type': setType(value); break;
      case 'points': setPoints(value); break;
      case 'dueDate': setDueDate(value); break;
      case 'dueTime': setDueTime(value); break;
      case 'description': setDescription(value); break;
      case 'instructions': setInstructions(value); break;
      case 'latePenalty': setLatePenalty(value); break;
      default: break;
    }
  }, []);

  // Validate on blur - prevents re-rendering during typing
  const handleFieldBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = 
      field === 'title' ? title :
      field === 'type' ? type :
      field === 'points' ? points :
      field === 'dueDate' ? dueDate : '';
    validateField(field, value);
  }, [title, type, points, dueDate, validateField]);

  const validateStep = useCallback(() => {
    const fieldsToValidate = activeStep === 0 
      ? ['title', 'type', 'points', 'dueDate'] 
      : [];
    
    let isValid = true;
    const newTouched = { ...touched };
    
    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
      const value = 
        field === 'title' ? title :
        field === 'type' ? type :
        field === 'points' ? points :
        field === 'dueDate' ? dueDate : '';
      
      isValid = isValid && validateField(field, value);
    });
    
    setTouched(newTouched);
    return isValid;
  }, [activeStep, title, type, points, dueDate, touched, validateField]);

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => setActiveStep(prev => prev - 1);
  const handleConfirmLeave = () => navigate(`/teacher/class/${classId}`);

  const handleQuestionChange = useCallback((id, field, value) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  }, []);

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { 
      id: Math.max(0, ...prev.map(q => q.id)) + 1, 
      text: '', 
      points: 5,
      expectedAnswer: ''
    }]);
  };

  const handleRemoveQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files).filter(file => 
      file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024
    );
    
    if (newFiles.length !== e.target.files.length) {
      setSubmitError('Only PDF files under 10MB are allowed');
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      const dateTime = new Date(`${dueDate}T${dueTime}`);

      const assignmentDTO = {
        title,
        type,
        points: Number(points),
        dueDate: dateTime.toISOString(),
        description,
        instructions,
        questions,
        allowLateSubmissions,
        latePenalty: Number(latePenalty),
        showPointsToStudents,
        allowAttachments,
        allowComments
      };

      formData.append('formData', new Blob([JSON.stringify(assignmentDTO)], { type: 'application/json' }));
      files.forEach(file => formData.append('attachments', file));

      await axios.post(
        `http://localhost:8080/api/assignments/${classId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      navigate(`/teacher/class/${classId}/assignments`);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setSubmitError(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar classes={[]} userRole="TEACHER" />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setConfirmLeaveOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-display font-bold text-gray-900">Create Assignment</h1>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index === activeStep 
                      ? 'bg-primary-500 text-white' 
                      : index < activeStep 
                      ? 'bg-success-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < activeStep ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                  </div>
                  <span className={`ml-3 font-medium ${
                    index === activeStep ? 'text-primary-600' : index < activeStep ? 'text-success-600' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    index < activeStep ? 'bg-success-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-8"
        >
          {submitError && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-600 text-sm">
              {submitError}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {activeStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => handleFieldBlur('title')}
                  className={`input-field ${touched.title && errors.title ? 'border-error-500' : ''}`}
                  placeholder="Enter assignment title"
                />
                {touched.title && errors.title && (
                  <p className="mt-1 text-sm text-error-600">{errors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Type <span className="text-error-600">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    onBlur={() => handleFieldBlur('type')}
                    className={`input-field ${touched.type && errors.type ? 'border-error-500' : ''}`}
                  >
                    <option value="">Select type</option>
                    {assignmentTypes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {touched.type && errors.type && (
                    <p className="mt-1 text-sm text-error-600">{errors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => handleFieldChange('points', e.target.value)}
                    onBlur={() => handleFieldBlur('points')}
                    className={`input-field ${touched.points && errors.points ? 'border-error-500' : ''}`}
                    placeholder="100"
                    min="1"
                    max="1000"
                  />
                  {touched.points && errors.points && (
                    <p className="mt-1 text-sm text-error-600">{errors.points}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    onBlur={() => handleFieldBlur('dueDate')}
                    className={`input-field ${touched.dueDate && errors.dueDate ? 'border-error-500' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Time <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => handleFieldChange('dueTime', e.target.value)}
                    onBlur={() => handleFieldBlur('dueDate')}
                    className={`input-field ${touched.dueDate && errors.dueDate ? 'border-error-500' : ''}`}
                  />
                </div>
              </div>
              {touched.dueDate && errors.dueDate && (
                <p className="text-sm text-error-600">{errors.dueDate}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Enter assignment description..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Content & Resources */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => handleFieldChange('instructions', e.target.value)}
                  className="input-field"
                  rows={6}
                  placeholder="Provide detailed instructions for the assignment..."
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAiDialogOpen(true)}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </button>
                    <button
                      onClick={handleAddQuestion}
                      className="btn-ghost flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="card p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => handleQuestionChange(question.id, 'points', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                            max="100"
                          />
                          <span className="text-sm text-gray-600">points</span>
                          <button
                            onClick={() => handleRemoveQuestion(question.id)}
                            disabled={questions.length === 1}
                            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={question.text}
                        onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                        className="input-field mb-3"
                        rows={3}
                        placeholder="Enter your question here..."
                      />
                      <input
                        type="text"
                        value={question.expectedAnswer}
                        onChange={(e) => handleQuestionChange(question.id, 'expectedAnswer', e.target.value)}
                        className="input-field"
                        placeholder="Expected Answer (optional)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500 mt-1">PDF files only (max 10MB each)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Publish */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="card p-6 bg-gradient-to-br from-primary-50 to-purple-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">{title}</h3>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {assignmentTypes.find(t => t.value === type)?.label || type}
                      </span>
                      <span className="text-gray-600">{points} points</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {dueDate && dueTime ? `${new Date(`${dueDate}T${dueTime}`).toLocaleString()}` : 'Not set'}</span>
                </div>

                {description && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                  </div>
                )}

                {instructions && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{instructions}</p>
                  </div>
                )}

                {questions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Questions ({questions.length})</h4>
                    <div className="space-y-2">
                      {questions.map((question, index) => (
                        <div key={question.id} className="pl-4 border-l-2 border-primary-200">
                          <p className="text-sm font-medium text-gray-900">
                            {index + 1}. ({question.points} points)
                          </p>
                          <p className="text-gray-700">{question.text || 'No question text'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Resources ({files.length})</h4>
                    <div className="space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Options</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowLateSubmissions}
                      onChange={(e) => setAllowLateSubmissions(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Allow late submissions</span>
                  </label>

                  {allowLateSubmissions && (
                    <div className="ml-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Penalty (%)
                      </label>
                      <input
                        type="number"
                        value={latePenalty}
                        onChange={(e) => handleFieldChange('latePenalty', e.target.value)}
                        className="input-field w-32"
                        min="0"
                        max="100"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPointsToStudents}
                      onChange={(e) => setShowPointsToStudents(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Show points to students</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowAttachments}
                      onChange={(e) => setAllowAttachments(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Allow students to upload attachments</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowComments}
                      onChange={(e) => setAllowComments(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Allow students to add comments</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={activeStep === 0 ? () => setConfirmLeaveOpen(true) : handleBack}
              className="btn-ghost"
              disabled={isSubmitting}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={activeStep === steps.length - 1 ? () => setPublishDialogOpen(true) : handleNext}
              className="btn-primary flex items-center gap-2"
              disabled={isSubmitting}
            >
              {activeStep === steps.length - 1 ? (
                <>
                  <Save className="w-5 h-5" />
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </>
              ) : (
                <>
                  Next
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Confirm Leave Dialog */}
        <Dialog.Root open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
              <Dialog.Title className="text-2xl font-display font-bold text-gray-900 mb-2">
                Discard changes?
              </Dialog.Title>
              <Dialog.Description className="text-gray-600 mb-6">
                Are you sure you want to leave? Any unsaved changes will be lost.
              </Dialog.Description>
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <button className="btn-ghost flex-1">Cancel</button>
                </Dialog.Close>
                <button
                  onClick={handleConfirmLeave}
                  className="btn-primary flex-1 bg-error-500 hover:bg-error-600"
                >
                  Discard
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* AI Question Generation Dialog */}
        <Dialog.Root open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-2xl font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary-600" />
                Generate Questions with AI
              </Dialog.Title>
              <Dialog.Description className="text-gray-600 mb-6">
                Let AI help you create questions for your assignment based on a topic.
              </Dialog.Description>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Introduction to Java Programming, World War II, Photosynthesis"
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="input-field"
                      disabled={isGenerating}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      value={aiNumberOfQuestions}
                      onChange={(e) => setAiNumberOfQuestions(parseInt(e.target.value) || 5)}
                      className="input-field"
                      min="1"
                      max="20"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={aiQuestionType}
                    onChange={(e) => setAiQuestionType(e.target.value)}
                    className="input-field"
                    disabled={isGenerating}
                  >
                    <option value="mixed">Mixed</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
              </div>
              
              {isGenerating && (
                <div className="mb-6 p-4 bg-primary-50 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <span className="text-primary-700">Generating questions with AI...</span>
                </div>
              )}
              
              {generatedQuestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Generated Questions</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-900">{q.question}</p>
                          <span className="text-xs text-gray-500 ml-2">{q.type}</span>
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="ml-4 mt-2">
                            <p className="text-xs text-gray-600 mb-1">Options:</p>
                            <ul className="list-disc list-inside text-sm text-gray-700">
                              {q.options.map((opt, optIdx) => (
                                <li key={optIdx}>{opt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.correctAnswer && (
                          <p className="text-xs text-gray-600 mt-2">
                            <span className="font-medium">Answer:</span> {q.correctAnswer}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{q.points || 10} points</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <button className="btn-ghost flex-1" disabled={isGenerating}>Cancel</button>
                </Dialog.Close>
                <button
                  onClick={async () => {
                    if (!aiTopic.trim()) {
                      alert('Please enter a topic');
                      return;
                    }
                    setIsGenerating(true);
                    setGeneratedQuestions([]);
                    try {
                      const response = await axios.post(
                        'http://localhost:8080/api/ai/generate-questions',
                        {
                          topic: aiTopic,
                          difficulty: aiDifficulty,
                          numberOfQuestions: aiNumberOfQuestions,
                          questionType: aiQuestionType
                        },
                        {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        }
                      );
                      setGeneratedQuestions(response.data.questions || []);
                    } catch (err) {
                      console.error('Error generating questions:', err);
                      alert('Failed to generate questions. Please try again.');
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isGenerating || !aiTopic.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Questions
                    </>
                  )}
                </button>
                {generatedQuestions.length > 0 && (
                  <button
                    onClick={() => {
                      const newQuestions = generatedQuestions.map((q, idx) => ({
                        id: Date.now() + idx,
                        text: q.question,
                        points: q.points || 10,
                        expectedAnswer: q.correctAnswer || ''
                      }));
                      setQuestions([...questions, ...newQuestions]);
                      setAiDialogOpen(false);
                      setGeneratedQuestions([]);
                      setAiTopic('');
                    }}
                    className="btn-primary flex-1 bg-success-500 hover:bg-success-600"
                  >
                    Add to Assignment
                  </button>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Publish Dialog */}
        <Dialog.Root open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
              <Dialog.Title className="text-2xl font-display font-bold text-gray-900 mb-2">
                Publish Assignment
              </Dialog.Title>
              {submitError && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-error-600 text-sm">
                  {submitError}
                </div>
              )}
              <Dialog.Description className="text-gray-600 mb-6">
                Are you ready to publish this assignment? Students will be able to view and submit to this assignment immediately.
              </Dialog.Description>
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <button className="btn-ghost flex-1" disabled={isSubmitting}>Cancel</button>
                </Dialog.Close>
                <button
                  onClick={handlePublish}
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </main>
    </div>
  );
}

export default AssignmentCreator;
