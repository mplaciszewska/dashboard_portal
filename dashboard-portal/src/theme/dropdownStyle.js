import { colors } from './colors';

const sharedSelectStyles = {
  container: (base) => ({
    ...base,
    width: '100%',
    minWidth: '110px',
    fontSize: '13px',
  }),
  control: (base) => ({
    ...base,
    borderColor: '#ccccccff',
    borderRadius: '20px',
    boxShadow: '0 0 5px 0 rgba(47, 49, 77, 0.10), 0 0 5px 0 rgba(84, 84, 84, 0.10)',
    border: '1.5px solid #ddddddff',
    marginBottom: '2px',
    minHeight: '30px',
    height: '35px',
    fontSize: '13px',
  }),
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
