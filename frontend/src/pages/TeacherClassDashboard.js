import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DateRangeIcon from '@mui/icons-material/DateRange';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleIcon from '@mui/icons-material/People';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentListPopup from '../components/StudentListPopup';

function TeacherClassDashboard() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classData, setClassData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [quickLinks, setQuickLinks] = useState([]);
  const [openQuickLinkDialog, setOpenQuickLinkDialog] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [studentListOpen, setStudentListOpen] = useState(false);

  // Helper to fetch quick links
  const fetchQuickLinks = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/quicklinks/class/${classId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setQuickLinks(response.data);
    } catch (err) {
      console.error('Error fetching quick links:', err);
    }
  };

  const handleAddQuickLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return;
    try {
      await axios.post(`http://localhost:8080/api/quicklinks`, {
        title: newLinkTitle,
        url: newLinkUrl,
        classId: classId
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setOpenQuickLinkDialog(false);
      fetchQuickLinks();
    } catch (err) {
      console.error('Error adding quick link:', err);
      alert('Failed to add quick link');
    }
  };

  const handleDeleteQuickLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/quicklinks/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchQuickLinks();
    } catch (err) {
      console.error('Error deleting quick link:', err);
    }
  };

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setClassData(response.data);
      } catch (err) {
        console.error('Error fetching class data:', err);
      }
    };

    const fetchAssignments = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/teacher/classes/${classId}/assignments`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAssignments(response.data);
      } catch (err) {
        console.error('Error fetching assignments:', err);
      }
    };

    const fetchRecentActivity = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/teacher/classes/${classId}/recent-activity`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRecentActivity(response.data);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/teacher/classes/${classId}/analytics`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAnalytics(response.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
    };

    fetchClassData();
    fetchAssignments();
    fetchRecentActivity();
    fetchAnalytics();
    fetchQuickLinks();
  }, [classId, user]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getDaysUntil = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {classData?.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {classData?.section} • {classData?.scheduleInfo}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {classData?.description}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Students
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
              {classData?.studentCount}
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => setStudentListOpen(true)}
            >
              View all students
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Average Grade
            </Typography>
            <Typography
              variant="h3"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 'medium',
                color: analytics.averageGrade >= 90 ? 'success.main' :
                  analytics.averageGrade >= 70 ? 'warning.main' : 'error.main'
              }}
            >
              {analytics.averageGrade}%
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(`/teacher/class/${classId}/analytics`)}
            >
              View Analytics
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Submission Rate
            </Typography>
            <Typography
              variant="h3"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 'medium',
                color: analytics.submissionRate >= 90 ? 'success.main' :
                  analytics.submissionRate >= 70 ? 'warning.main' : 'error.main'
              }}
            >
              {analytics.submissionRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analytics.atRiskStudents} students at risk
            </Typography>
          </Paper>
        </Grid>

        {/* Recent Assignments */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Assignments</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={() => navigate(`/teacher/class/${classId}/assignments/create`)}
              >
                Create
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {assignments.map((assignment) => {
              const daysUntil = getDaysUntil(assignment.dueDate);
              const isOverdue = daysUntil < 0;
              const isDueSoon = daysUntil >= 0 && daysUntil <= 2;

              return (
                <Card
                  key={assignment.id}
                  variant="outlined"
                  sx={{ mb: 2, borderRadius: 1 }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="h6" component="div">
                            {assignment.title}
                          </Typography>
                          <Chip
                            label={assignment.type}
                            size="small"
                            sx={{ ml: 1, fontSize: '0.75rem' }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Due {formatDateTime(assignment.dueDate)} • {assignment.pointsPossible} points
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography
                        variant="body2"
                        color={isOverdue ? "error.main" : isDueSoon ? "warning.main" : "text.secondary"}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        {isOverdue ? (
                          <AssignmentLateIcon fontSize="small" sx={{ mr: 0.5 }} />
                        ) : (
                          <DateRangeIcon fontSize="small" sx={{ mr: 0.5 }} />
                        )}
                        {isOverdue
                          ? `Overdue by ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'}`
                          : isDueSoon
                            ? daysUntil === 0
                              ? 'Due today'
                              : `Due in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
                            : `Due in ${daysUntil} days`
                        }
                      </Typography>
                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                        <AssignmentTurnedInIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          {assignment.submittedCount}/{assignment.totalCount} submitted
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/teacher/class/${classId}/assignments/${assignment.id}`)}
                    >
                      View details
                    </Button>
                    <Button
                      size="small"
                      onClick={() => navigate(`/teacher/class/${classId}/assignments/${assignment.id}/submissions`)}
                    >
                      View submissions
                    </Button>
                  </CardActions>
                </Card>
              );
            })}

            {assignments.length === 0 && (
              <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No assignments created yet.
              </Typography>
            )}

            <Button
              variant="text"
              endIcon={<ArrowForwardIcon />}
              sx={{ alignSelf: 'flex-end' }}
              onClick={() => navigate(`/teacher/class/${classId}/assignments`)}
            >
              View all assignments
            </Button>
          </Paper>
        </Grid>

        {/* Quick Links Section */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Quick Links</Typography>
              <IconButton
                size="small"
                color="primary"
                onClick={() => setOpenQuickLinkDialog(true)}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List sx={{ width: '100%', flex: 1 }}>
              {quickLinks.map((link) => (
                <ListItem
                  key={link.id}
                  disablePadding
                  sx={{ mb: 1 }}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeleteQuickLink(link.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LinkIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', '&:hover': { textDecoration: 'underline' } }}>
                          {link.title}
                        </Typography>
                      </a>
                    }
                  />
                </ListItem>
              ))}

              {quickLinks.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No quick links added.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List sx={{ width: '100%', flex: 1 }}>
              {recentActivity.map((activity) => (
                <ListItem
                  key={activity.id}
                  alignItems="flex-start"
                  disablePadding
                  sx={{ mb: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar
                      src={activity.avatarUrl}
                      alt={activity.studentName}
                      sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                    >
                      {getInitials(activity.studentName)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ fontWeight: 'medium' }}
                        >
                          {activity.studentName}
                        </Typography>
                        {' '}
                        {activity.action}
                        {' '}
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ fontWeight: 'medium' }}
                        >
                          {activity.assignment}
                        </Typography>
                      </Typography>
                    }
                    secondary={formatRelativeTime(activity.timestamp)}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}

              {recentActivity.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No recent activity.
                </Typography>
              )}
            </List>

            <Button
              variant="text"
              endIcon={<ArrowForwardIcon />}
              sx={{ alignSelf: 'flex-end', mt: 1 }}
              onClick={() => navigate(`/teacher/class/${classId}/activity`)}
            >
              View all activity
            </Button>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate(`/teacher/class/${classId}/assignments/create`)}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Create Assignment
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => setStudentListOpen(true)}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Manage Students
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DateRangeIcon />}
                  onClick={() => navigate(`/teacher/class/${classId}/schedule`)}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Class Schedule
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AssignmentTurnedInIcon />}
                  onClick={() => navigate(`/teacher/class/${classId}/analytics`)}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Analytics
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Link Dialog */}
      <Dialog open={openQuickLinkDialog} onClose={() => setOpenQuickLinkDialog(false)}>
        <DialogTitle>Add Quick Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL"
            fullWidth
            variant="outlined"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQuickLinkDialog(false)}>Cancel</Button>
          <Button onClick={handleAddQuickLink} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Student List Popup */}
      <StudentListPopup
        isOpen={studentListOpen}
        onClose={() => setStudentListOpen(false)}
        classId={classId}
        classTitle={classData?.name}
      />
    </Container>
  );
}

export default TeacherClassDashboard;
