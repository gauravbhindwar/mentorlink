"use client";
import { createContext, useContext, useReducer } from 'react';

const ArchiveDataContext = createContext();

const initialState = {
  mentors: [],
  mentees: [],
  meetings: [],
  stats: { mentors: 0, mentees: 0, meetings: 0 },
  dataFetched: {
    mentors: false,
    mentees: false,
    meetings: false
  }
};

const archiveReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        [action.dataType]: action.data,
        dataFetched: {
          ...state.dataFetched,
          [action.dataType]: true
        }
      };
    case 'SET_STATS':
      return {
        ...state,
        stats: action.stats
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export function ArchiveDataProvider({ children }) {
  const [state, dispatch] = useReducer(archiveReducer, initialState);

  return (
    <ArchiveDataContext.Provider value={{ state, dispatch }}>
      {children}
    </ArchiveDataContext.Provider>
  );
}

export const useArchiveData = () => useContext(ArchiveDataContext);
