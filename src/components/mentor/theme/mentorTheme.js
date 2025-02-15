import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#f97316",
    },
    secondary: {
      main: "#ea580c",
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
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#f97316",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#f97316",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              "& input, & textarea": {
                color: "rgba(255, 255, 255, 0.7)",
                WebkitTextFillColor: "rgba(255, 255, 255, 0.7)",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.2)",
              },
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(255, 255, 255, 0.7)",
            "&.Mui-disabled": {
              color: "rgba(255, 255, 255, 0.5)",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(17, 17, 17, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});
