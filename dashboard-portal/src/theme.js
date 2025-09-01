import { createTheme } from '@mui/material/styles';

const burgundy = '#800020';

const theme = createTheme({
  palette: {
    primary: {
        main: burgundy,
        contrastText: '#fff',
    },
    },
    typography: {
        fontFamily: `"Chiron Sung HK", serif`,
    },
  components: {
    MuiButton: {
        styleOverrides: {
        root: {
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
            backgroundColor: 'transparent',
            },
        },
        outlined: {
            color: burgundy,
            borderColor: burgundy,
            fontSize: '12px',
            
            '&:hover': {
            backgroundColor: `${burgundy}10`,
            borderColor: burgundy,
            },
        },
        },
        defaultProps: {
        disableElevation: true,
        },
    },
    MuiTouchRipple: {
      styleOverrides: {
        child: {
          backgroundColor: burgundy,
        },
      },
    },
  },
});

export default theme;
