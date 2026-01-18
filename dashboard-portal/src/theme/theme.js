import { createTheme } from '@mui/material/styles';
import { colors } from './colors';  


const theme = createTheme({
  palette: {
    primary: {
        main: colors.secondaryOpaque,
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
            color: colors.secondaryOpaque,
            border: `2px solid ${colors.secondary}`,
            fontSize: '13px',
            
            '&:hover': {
            backgroundColor: `${colors.secondary}10`,
            borderColor: colors.secondary,
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
          backgroundColor: colors.secondaryOpaque,
        },
      },
    },
  },
});

export default theme;
