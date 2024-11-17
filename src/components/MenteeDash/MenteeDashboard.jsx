"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  useMediaQuery,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  Slide,
  Alert,
  AlertTitle,
  LinearProgress,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const MenteeDashboard = () => {
  const [menteeDetails, setMenteeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "",
  });

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: "", severity }), 3000);
  };

  useEffect(() => {
    const fetchMenteeDetails = async () => {
      try {
        const response = await axios.get("/api/mentee/details");
        setMenteeDetails(response.data);
      } catch (error) {
        showAlert("Error fetching mentee details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMenteeDetails();
  }, []);

  const theme = createTheme({
    palette: {
      primary: {
        main: "#f97316", // orange-500
      },
      secondary: {
        main: "#ea580c", // orange-600
      },
      background: {
        default: "#0a0a0a",
        paper: "rgba(255, 255, 255, 0.05)",
      },
      text: {
        primary: "#ffffff",
        secondary: "rgba(255, 255, 255, 0.7)",
      },
    },
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress sx={{ color: "#f97316" }} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md max-h-screen">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "rgba(0, 0, 0, 0.8)",
              color: "#fff",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.75rem",
            },
          }}
        />
        <Snackbar
          open={alert.open}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          TransitionComponent={(props) => <Slide {...props} direction="down" />}
          sx={{
            "& .MuiSnackbarContent-root": {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.75rem",
            },
          }}
        >
          <Alert
            severity={alert.severity}
            onClose={() => setAlert({ ...alert, open: false })}
            sx={{
              backgroundColor: "transparent",
              color: "#fff",
              "& .MuiAlert-icon": {
                color: "#fff",
              },
            }}
          >
            <AlertTitle>
              {alert.severity === "error" ? "Error" : "Success"}
            </AlertTitle>
            {alert.message}
          </Alert>
        </Snackbar>
      </div>

      <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="relative z-10 px-4 md:px-6 py-24 max-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.h1
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-5 !leading-snug"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mentee Dashboard
            </motion.h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/10"
          >
            {/* {menteeDetails ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ color: '#f97316', fontWeight: 600 }}>
                  Welcome, {menteeDetails.name}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  MUJid: {menteeDetails.MUJid}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Email: {menteeDetails.email}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Phone: {menteeDetails.phone_number}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Year of Registration: {menteeDetails.yearOfRegistration}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Current Semester: {menteeDetails.current_semester}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Section: {menteeDetails.section}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No details available.
              </Typography>
            )} */}

            {meeting.date.toISOString() >= new Date().toISOString() ? (
              <>
                <Typography
                  variant="h6"
                  sx={{ color: "#f97316", fontWeight: 600 }}
                >
                  Meeting scheduled!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Date:{" "}
                  {months[meeting.date.getMonth()] +
                    " " +
                    meeting.date.getDate() +
                    ", " +
                    meeting.date.getFullYear()}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Time: {meeting.time}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Location: {meeting.location}
                </Typography>
              </>
            ) : (
              <Typography
                variant="body1"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                No meetings scheduled.
              </Typography>
            )}
          </motion.div>

          {/* Cards Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.1 },
                }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 0 30px ${card.shadowColor}`,
                }}
                className={`
                                relative overflow-hidden
                                bg-gradient-to-br ${card.gradient}
                                rounded-lg p-4
                                cursor-pointer
                                transition-all duration-500
                                border border-white/10
                                backdrop-blur-sm
                                hover:border-white/20
                            `}
                onClick={card.onClick}
              >
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl mb-3 block">{card.icon}</span>
                <h3 className="text-lg font-bold text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-white/80 text-sm">{card.description}</p>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:w-24 group-hover:h-24 transition-all" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </ThemeProvider>
  );
};

const meeting = {
  date: new Date(2025, 10, 20),
  time: "3:30 PM",
  location: "FB6, 2AB",
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const cards = [
  {
    title: "View Profile",
    icon: "👨‍🎓",
    description: "View your registered details",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    shadowColor: "rgba(251, 146, 60, 0.4)",
    onClick: () => {}, // Updated path
  },
  {
    title: "Raise Query",
    icon: "❓",
    description: "Got any problems? Ask your mentors directly!",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    shadowColor: "rgba(16, 185, 129, 0.4)",
    onClick: () => {},
  },
  {
    title: "View Past Meetings",
    icon: "📊",
    description: "View the meeting reports for previously held meetings",
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    shadowColor: "rgba(147, 51, 234, 0.4)",
    onClick: () => {},
  },
];

export default MenteeDashboard;
