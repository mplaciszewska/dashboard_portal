import { colors } from './colors';

const sharedSelectStyles = {
  container: (base) => ({
    ...base,
    width: '100%',
    minWidth: '70px',
    fontSize: '13px',
  }),
  control: (base, state) => {
    const isActive = !!(state.isFocused || state.selectProps?.menuIsOpen);
    const activeBorder = isActive ? colors.secondary : '#e7e7e7ff';
    return {
      ...base,
      borderColor: activeBorder,
      borderRadius: '8px',
      boxShadow: isActive
        ? ` 0 0 5px 1.1px rgba(135, 135, 135, 0.1)`
        : ' 0 0 5px 1.1px rgba(135, 135, 125, 0.1)',
      border: `2px solid ${activeBorder}`,
      marginBottom: '2px',
      minHeight: '30px',
      height: '35px',
      fontSize: '13px',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
      outline: 'none',
      '&:hover': {
        borderColor: activeBorder,
      },
      '&:active': {
        borderColor: activeBorder,
      },
    };
  },
  valueContainer: (base) => ({
    ...base,
    height: '35px',
    padding: '3px 8px',
  }),
  input: (base) => ({
    ...base,
    margin: '0px',
    padding: '0px',
  }),
  placeholder: (base) => ({
    ...base,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '13px',
    color: '#6b6b6b',
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: '13px',
    color: '#111',
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: '30px',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    fontSize: '13px',
    margin: '5px 0',
    borderRadius: '8px'
  }),
  menuList: (base) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: 0,
    maxHeight: '180px',
    overflowY: 'auto',
    borderRadius: '8px',
    '::-webkit-scrollbar': {
      width: '3px',
      background: '#f0f0f000',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'rgba(200, 200, 200, 1)',
      borderRadius: '4px',
    },
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(200, 200, 200, 1) #f0f0f000',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? colors.secondary
      : state.isFocused
      ? '#eee'
      : 'white',
    color: 'black',
    fontSize: '13px',
    padding: '6px 10px',
    margin: 0,
  }),
};

export default sharedSelectStyles;
